_ = require 'prelude-ls'
WebSocket = require 'ws'
ulid = require 'ulid'

#urls = [process.argv[3] || 'ws://localhost:8080/ws']
urls = [
	"ws://localhost:8090/ws"
	"ws://localhost:8091/ws"
	"ws://localhost:8092/ws"
	"ws://localhost:8093/ws"
]

console.log "Connecting to #{urls}"

connect = ->

	url = urls[Math.floor(Math.random()*urls.length)]

	ws = new WebSocket do
		url
		do
			rejectUnauthorized: false

	ws.on 'open', ->
		ws |> ping
		ws |> bigping
		setTimeout do
			-> 
				ws.close()
				connect!
			1000
		return

		setInterval do
			-> 
				for i from 0 to 0
					ws |> ping
					ws |> bigping
			1000
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

[1 to 1000] 
	|> _.map ->
		connect!