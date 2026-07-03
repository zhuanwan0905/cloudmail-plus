import app from '../hono/hono';
import result from '../model/result';
import apiKeyService from '../service/api-key-service';
import userContext from '../security/user-context';

app.post('/apiKey/create', async (c) => {
	const data = await apiKeyService.create(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.get('/apiKey/list', async (c) => {
	const list = await apiKeyService.list(c);
	return c.json(result.ok(list));
});

app.delete('/apiKey/delete', async (c) => {
	await apiKeyService.delete(c, c.req.query());
	return c.json(result.ok());
});
