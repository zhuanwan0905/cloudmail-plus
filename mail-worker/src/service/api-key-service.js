import BizError from '../error/biz-error';
import orm from '../entity/orm';
import apiKey from '../entity/api-key';
import account from '../entity/account';
import email from '../entity/email';
import user from '../entity/user';
import { v4 as uuidv4 } from 'uuid';
import { and, eq, desc, count, lt, gt, asc, sql, inArray } from 'drizzle-orm';
import { emailConst, isDel } from '../const/entity-const';
import { formatDetailDate } from '../utils/date-uitil';
import emailUtils from '../utils/email-utils';
import verifyUtils from '../utils/verify-utils';
import attService from './att-service';
import emailService from './email-service';

const apiKeyService = {

	async create(c, params, userId) {
		const { name, expireTime } = params;

		if (!name) {
			throw new BizError('API 密钥名称不能为空');
		}

		const key = 'cm_' + uuidv4().replace(/-/g, '');

		await orm(c).insert(apiKey).values({
			key,
			name,
			userId,
			expireTime: expireTime ? formatDetailDate(expireTime) : null,
		}).run();

		return { key, name };
	},

	async list(c) {
		const list = await orm(c).select().from(apiKey)
			.orderBy(desc(apiKey.apiKeyId))
			.all();

		const userIds = [...new Set(list.map(item => item.userId))];
		const userList = await orm(c).select({ userId: user.userId, email: user.email })
			.from(user)
			.where(sql`${user.userId} IN (${userIds.join(',')})`)
			.all();

		const userMap = {};
		userList.forEach(u => { userMap[u.userId] = u.email; });

		list.forEach(item => {
			item.userEmail = userMap[item.userId] || '';
		});

		return list;
	},

	async delete(c, params) {
		let { apiKeyIds } = params;
		apiKeyIds = apiKeyIds.split(',').map(id => Number(id));
		await orm(c).delete(apiKey).where(inArray(apiKey.apiKeyId, apiKeyIds)).run();
	},

	async validateApiKey(c, key) {
		if (!key) {
			return null;
		}

		const apiKeyRow = await orm(c).select().from(apiKey)
			.where(and(eq(apiKey.key, key), eq(apiKey.status, 0)))
			.get();

		if (!apiKeyRow) {
			return null;
		}

		if (apiKeyRow.expireTime) {
			const now = new Date().toISOString();
			if (apiKeyRow.expireTime < now) {
				return null;
			}
		}

		return apiKeyRow;
	},

	async createMailbox(c, params, apiKeyRow) {
		const { email: mailboxEmail } = params;
		const userId = apiKeyRow.userId;

		if (!mailboxEmail) {
			throw new BizError('邮箱地址不能为空');
		}

		if (!verifyUtils.isEmail(mailboxEmail)) {
			throw new BizError('邮箱格式不正确');
		}

		if (!c.env.domain.includes(emailUtils.getDomain(mailboxEmail))) {
			throw new BizError('邮箱域名不在允许范围内');
		}

		const existAccount = await orm(c).select().from(account)
			.where(and(
				sql`${account.email} COLLATE NOCASE = ${mailboxEmail}`,
				eq(account.isDel, isDel.NORMAL)
			))
			.get();

		if (existAccount) {
			throw new BizError('该邮箱地址已被使用');
		}

		const result = await orm(c).insert(account).values({
			email: mailboxEmail,
			userId,
			name: emailUtils.getName(mailboxEmail),
		}).returning().get();

		return result;
	},

	async listMailboxes(c, params, apiKeyRow) {
		const userId = apiKeyRow.userId;

		let { accountId, size, lastSort } = params;
		accountId = Number(accountId) || 0;
		size = Number(size) || 30;
		lastSort = Number(lastSort);
		if (size > 50) size = 50;
		if (Number.isNaN(lastSort)) lastSort = 9999999999;

		const list = await orm(c).select().from(account).where(
			and(
				eq(account.userId, userId),
				eq(account.isDel, isDel.NORMAL),
				sql`(${account.sort} < ${lastSort} OR (${account.sort} = ${lastSort} AND ${account.accountId} > ${accountId}))`
			)
		)
			.orderBy(desc(account.sort), asc(account.accountId))
			.limit(size)
			.all();

		const { total } = await orm(c).select({ total: count() }).from(account)
			.where(and(eq(account.userId, userId), eq(account.isDel, isDel.NORMAL)))
			.get();

		return { list, total };
	},

	async getMailboxInfo(c, params, apiKeyRow) {
		const { accountId } = params;
		const accountRow = await orm(c).select().from(account).where(
			and(eq(account.accountId, Number(accountId)), eq(account.userId, apiKeyRow.userId), eq(account.isDel, isDel.NORMAL))
		).get();

		if (!accountRow) {
			throw new BizError('邮箱不存在');
		}

		const receiveCount = await orm(c).select({ total: count() }).from(email).where(
			and(eq(email.accountId, accountRow.accountId), eq(email.type, emailConst.type.RECEIVE), eq(email.isDel, isDel.NORMAL))
		).get();

		return { ...accountRow, receiveCount: receiveCount.total };
	},

	async deleteMailbox(c, params, apiKeyRow) {
		const { accountId } = params;
		const accountRow = await orm(c).select().from(account).where(
			and(eq(account.accountId, Number(accountId)), eq(account.userId, apiKeyRow.userId), eq(account.isDel, isDel.NORMAL))
		).get();

		if (!accountRow) {
			throw new BizError('邮箱不存在');
		}

		await orm(c).update(account).set({ isDel: isDel.DELETE }).where(eq(account.accountId, accountRow.accountId)).run();
	},

	async getEmailList(c, params, apiKeyRow) {
		let { emailId, type, accountId, size, timeSort } = params;

		size = Number(size) || 30;
		emailId = Number(emailId);
		timeSort = Number(timeSort);
		accountId = Number(accountId);
		if (size > 50) size = 50;
		if (!emailId) emailId = timeSort ? 0 : 9999999999;

		const conditions = [
			eq(email.userId, apiKeyRow.userId),
			eq(email.accountId, accountId),
			eq(email.isDel, isDel.NORMAL),
		];

		if (type !== undefined && type !== null && type !== '') {
			conditions.push(eq(email.type, Number(type)));
		}

		conditions.push(timeSort ? gt(email.emailId, emailId) : lt(email.emailId, emailId));

		const list = await orm(c).select().from(email)
			.where(and(...conditions))
			.orderBy(timeSort ? asc(email.emailId) : desc(email.emailId))
			.limit(size)
			.all();

		await this.addAttachments(c, list);

		const { total } = await orm(c).select({ total: count() }).from(email)
			.where(and(
				eq(email.userId, apiKeyRow.userId),
				eq(email.accountId, accountId),
				eq(email.isDel, isDel.NORMAL),
				type !== undefined && type !== null && type !== '' ? eq(email.type, Number(type)) : eq(1, 1)
			)).get();

		return { list, total };
	},

	async getEmailDetail(c, params, apiKeyRow) {
		const { emailId } = params;
		const emailRow = await orm(c).select().from(email).where(
			and(eq(email.emailId, Number(emailId)), eq(email.userId, apiKeyRow.userId), eq(email.isDel, isDel.NORMAL))
		).get();

		if (!emailRow) {
			throw new BizError('邮件不存在');
		}

		await this.addAttachments(c, [emailRow]);

		return emailRow;
	},

	async sendEmail(c, params, apiKeyRow) {
		let {
			accountId,
			name,
			receiveEmail,
			text,
			content,
			subject,
			attachments = [],
			sendType,
			emailId,
		} = params;

		const accountRow = await orm(c).select().from(account).where(
			and(eq(account.accountId, Number(accountId)), eq(account.userId, apiKeyRow.userId), eq(account.isDel, isDel.NORMAL))
		).get();

		if (!accountRow) {
			throw new BizError('发件邮箱不存在或不属于此 API 密钥');
		}

		// Build identifier line
		const receiveList = Array.isArray(receiveEmail) ? receiveEmail : [receiveEmail];
		const identifierLine = receiveList.map(recv => `接收：${recv}  发送人：${accountRow.email}`).join('\n');

		// Prepend identifier to content
		if (content) {
			content = `<p>${identifierLine.replace(/\n/g, '<br>')}</p>${content}`;
		} else {
			content = `<p>${identifierLine.replace(/\n/g, '<br>')}</p>`;
		}

		// Prepend identifier to text
		if (text) {
			text = identifierLine + '\n\n' + text;
		} else {
			text = identifierLine;
		}

		// Reuse existing email service for sending
		const sendResult = await emailService.send(c, {
			accountId: Number(accountId),
			name: name || emailUtils.getName(accountRow.email),
			receiveEmail: receiveList,
			text,
			content,
			subject: subject || '',
			attachments,
			sendType: sendType || 'new',
			emailId: emailId || 0,
		}, apiKeyRow.userId);

		return sendResult[0];
	},

	async deleteEmail(c, params, apiKeyRow) {
		const { emailIds } = params;
		const emailIdList = Array.isArray(emailIds)
			? emailIds.map(Number)
			: emailIds.split(',').map(Number);

		await orm(c).update(email).set({ isDel: isDel.DELETE }).where(
			and(eq(email.userId, apiKeyRow.userId), inArray(email.emailId, emailIdList))
		).run();
	},

	async addAttachments(c, emailList) {
		const emailIds = emailList.map(item => item.emailId);
		if (emailIds.length > 0) {
			const attList = await attService.selectByEmailIds(c, emailIds);
			emailList.forEach(emailRow => {
				const atts = attList.filter(attRow => attRow.emailId === emailRow.emailId);
				emailRow.attList = atts;
			});
		}
	},
};

export default apiKeyService;
