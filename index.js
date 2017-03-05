'use strict';

const express = require('express');
const _ = require('lodash');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');

configureStatic();
configureSocket();

server.listen(80);


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

        socket.on('echo',function(data){
            socket.emit('echo', data);
        });
        socket.on('handsUp', function () {
            if (activeTicket) {
                removeActiveTicket();
            }
            var ticketInfo = {id:ticketCounter++, time:(Date.now())};
            activeTicket = ticketInfo;
            tickets.push(ticketInfo);
            socket.emit('onTicketActivated', ticketInfo);
            checkAndUpdateTopMostTicket();
        });
        socket.on('handsDown', removeActiveTicket);

        function removeActiveTicket() {
            tickets = tickets.filter(function (item) { return item !== activeTicket });
            socket.emit('onTicketRemoved', activeTicket);
            activeTicket = undefined;
            checkAndUpdateTopMostTicket();
        }
        emitTopTicket(socket);
        socket.emit('welcome', function () {});
    });



    function checkAndUpdateTopMostTicket() {
        if (currentTopTicket !== _.first(tickets)) {
            currentTopTicket = _.first(tickets);
            emitTopTicket(io);
        }
    }

    function emitTopTicket(socket) {
        socket.emit('updateTopMostTicket', { ticket:currentTopTicket, totalCount: tickets.length});
    }
}