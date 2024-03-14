import { createServer } from 'node:http';

const server = createServer((_, res) => {
    res.end('Hello, World!');
});

// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});