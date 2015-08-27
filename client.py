#!/usr/bin/env python
import socket

# Creates a TCP Socket and connects
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("41.186.56.128", 9000))

# Write the arguments on the socket to the node.js server
s.send("250784306298 1000");

# Receives result from node.js server
data = s.recv(1024)

print "result code: ", data

s.close();