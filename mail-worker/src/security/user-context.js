import BizError from '../error/biz-error';
import JwtUtils from '../utils/jwt-utils';
import constant from '../const/constant';

const userContext = {
    getUserId(c) {
        const user = c.get('user');
        if (!user) {
            throw new BizError('用户信息异常，请重新登录', 401);
        }
        return user.userId;
    },
    getUser(c) {
        return c.get('user');
    },
    async getToken(c) {
        const jwt = c.req.header(constant.TOKEN_HEADER);
        const result = await JwtUtils.verifyToken(c, jwt);
        return result?.token;
    },
};
export default userContext;
