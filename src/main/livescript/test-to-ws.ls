WebSocket = require 'ws'
ulid = require 'ulid'

url = process.argv[3] || 'ws://localhost:8080/ws'

console.log "Connecting to #{url}"

ws = new WebSocket do
	url
	do
		rejectUnauthorized: false

ws.on 'open', ->
	for i from 0 to 0
		ws |> ping
		ws |> bigping
	return
	setTimeout do
		-> ws.close()
		10000

ws.on 'message', (data) ->
	console.log "Received #{data}"
	return

ping = (ws) ->
	event =
		token: "tom@synthesis.co.za"
		resource: "TEST"
		action: "PING"
	console.log "Sending  #{event |> JSON.stringify}"
	ws.send (event |> JSON.stringify)

bigping = (ws) ->
	event =
		token: "tom@synthesis.co.za"
		resource: "TEST"
		action: "BIGPING"
	console.log "Sending  #{event |> JSON.stringify}"
	ws.send (event |> JSON.stringify)
