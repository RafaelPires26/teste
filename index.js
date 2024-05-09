import express, { response } from 'express';

const app = express()

app.get('/', (request, response) => {
    return response.json({ message: 'Teste'  });
})

app.listen(3333);