'use strict';

const express = require('express');
const _ = require('lodash');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');

const host = process.env.host || 'localhost';
const port = process.env.port || 80;

configureStatic();
configureSocket();

server.listen(port, host);


function configureStatic() {
    app.use('/socket.io/socket.io.js', express.static(path.resolve(__dirname, '../node_modules/socket.io-client/socket.io.js')));
    app.use('/', express.static('static'));
}

function configureSocket() {
    var tickets = [];
    var ticketCounter = 0;
    var currentTopTicket;
    io.on('connection', function(socket){
        var activeTicket;

        socket.on('disconnect', function() {
            console.log('Got disconnect!');

            removeActiveTicket(false);
        });

        socket.on('echo',function(data){
            socket.emit('echo', data);
        });
        socket.on('handsUp', function () {
            if (activeTicket) {
                removeActiveTicket();
            }
            var ticketId = ticketCounter++;
            var ticketInfo = { id: ticketId, time: (Date.now()) };
            activeTicket = ticketInfo;
            tickets.push(ticketInfo);
            socket.emit('onTicketActivated', ticketInfo);
            checkAndUpdateTopMostTicket();
        });
        socket.on('handsDown', removeActiveTicket);

        function removeActiveTicket(emitNotif) {
            var oldActiveTicket = activeTicket;
            activeTicket = undefined;
            tickets = tickets.filter(function (item) { return item !== oldActiveTicket });
            checkAndUpdateTopMostTicket();
            !emitNotif && socket.emit('onTicketRemoved', oldActiveTicket);
        }
        emitTopTicket(socket);
        socket.emit('welcome', function () {});
    });



    function checkAndUpdateTopMostTicket() {
        if (currentTopTicket !== _.first(tickets)) {
            currentTopTicket = _.first(tickets);
        }
        emitTopTicket(io);
    }

    function emitTopTicket(socket) {
        socket.emit('updateTopMostTicket', { ticket:currentTopTicket, totalCount: tickets.length});
    }
}