import http from '@/axios/index.js';

export function apiKeyList(params) {
    return http.get('/apiKey/list', {params:{...params}})
}

export function apiKeyCreate(form) {
    return http.post('/apiKey/create', form)
}

export function apiKeyDelete(apiKeyIds) {
    return http.delete('/apiKey/delete?apiKeyIds=' + apiKeyIds)
}
