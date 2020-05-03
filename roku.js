const server = net.createServer((c) => {

    // 'connection' listener
    console.log('client connected');

    c.on('end', () => {
      console.log('client disconnected');
    });

    c.write('hello\r\n');
    c.pipe(c);

    setInterval(() => {
        c.write("A TEST RESULT...")
    }, 2500);
});

server.on('error', (err) => {
    throw err;
});

server.listen(20002, () => {
    console.log('server bound');
});

exports.server = server;