import app from '../hono/hono';
import result from '../model/result';
import apiKeyService from '../service/api-key-service';
import BizError from '../error/biz-error';

const API_KEY_HEADER = 'X-Api-Key';

async function apiKeyAuth(c, next) {
	const key = c.req.header(API_KEY_HEADER);
	if (!key) {
		return c.json(result.fail('缺少 API 密钥', 401));
	}

	const apiKeyRow = await apiKeyService.validateApiKey(c, key);
	if (!apiKeyRow) {
		return c.json(result.fail('API 密钥无效或已过期', 401));
	}

	c.set('apiKey', apiKeyRow);
	return await next();
}

// All /v1/* routes require a valid API key
app.use('/v1/*', apiKeyAuth);

// Create a new mailbox
app.post('/v1/mailbox/create', async (c) => {
	try {
		const data = await apiKeyService.createMailbox(c, await c.req.json(), c.get('apiKey'));
		return c.json(result.ok(data));
	} catch (e) {
		return c.json(result.fail(e.message, e.code || 500));
	}
});

// List mailboxes
app.get('/v1/mailbox/list', async (c) => {
	try {
		const data = await apiKeyService.listMailboxes(c, c.req.query(), c.get('apiKey'));
		return c.json(result.ok(data));
	} catch (e) {
		return c.json(result.fail(e.message, e.code || 500));
	}
});

// Get mailbox info (status)
app.get('/v1/mailbox/info', async (c) => {
	try {
		const data = await apiKeyService.getMailboxInfo(c, c.req.query(), c.get('apiKey'));
		return c.json(result.ok(data));
	} catch (e) {
		return c.json(result.fail(e.message, e.code || 500));
	}
});

// Delete a mailbox
app.delete('/v1/mailbox/delete', async (c) => {
	try {
		await apiKeyService.deleteMailbox(c, c.req.query(), c.get('apiKey'));
		return c.json(result.ok());
	} catch (e) {
		return c.json(result.fail(e.message, e.code || 500));
	}
});

// Get email list for a mailbox
app.get('/v1/email/list', async (c) => {
	try {
		const data = await apiKeyService.getEmailList(c, c.req.query(), c.get('apiKey'));
		return c.json(result.ok(data));
	} catch (e) {
		return c.json(result.fail(e.message, e.code || 500));
	}
});

// Get email detail
app.get('/v1/email/detail', async (c) => {
	try {
		const data = await apiKeyService.getEmailDetail(c, c.req.query(), c.get('apiKey'));
		return c.json(result.ok(data));
	} catch (e) {
		return c.json(result.fail(e.message, e.code || 500));
	}
});

// Send email
app.post('/v1/email/send', async (c) => {
	try {
		const data = await apiKeyService.sendEmail(c, await c.req.json(), c.get('apiKey'));
		return c.json(result.ok(data));
	} catch (e) {
		return c.json(result.fail(e.message, e.code || 500));
	}
});

// Delete emails
app.delete('/v1/email/delete', async (c) => {
	try {
		await apiKeyService.deleteEmail(c, c.req.query(), c.get('apiKey'));
		return c.json(result.ok());
	} catch (e) {
		return c.json(result.fail(e.message, e.code || 500));
	}
});
