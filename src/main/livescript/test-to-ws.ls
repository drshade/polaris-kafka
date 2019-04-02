WebSocket = require 'ws'
ulid = require 'ulid'

url = 'ws://localhost:8080/ws'

ws = new WebSocket do
	url
	do
		rejectUnauthorized: false

ws.on 'open', ->
	for i from 0 to 99999
		ws |> login
	ws.close()

ws.on 'message', (data) ->
	console.log "Received #{data}"
	return

login = (ws) ->
	cmd =
		msg: "blah"
	console.log "Sending  #{cmd |> JSON.stringify}"
	ws.send (cmd |> JSON.stringify)
