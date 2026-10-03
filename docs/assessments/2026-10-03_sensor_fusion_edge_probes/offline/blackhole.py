import socket, threading
s = socket.socket(); s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1); s.bind(("127.0.0.1", 8799)); s.listen(50)
conns = []
while True:
    c, _ = s.accept(); conns.append(c)   # accept and never answer: a link that is up but goes nowhere

