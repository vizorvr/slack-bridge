const CHANNEL = process.env.CHANNEL || 'editor-chat'
const SlackBot = require('slackbots')
const redis = require('redis')
const SerialNumber = require('redis-serial')

function createRedisClient() {
	return redis.createClient({
		host: process.env.REDIS || 'localhost'
	})
}

exports.shouldDrop = function shouldDrop(text) {
	return !!text.match(/\<@\S+\|\S+\>/)
}

exports.filterText = function filterText(text) {
	return text.replace(/[\<\>]+/g, '')
}

function VizorSlackBot() {
	var that = this

	this._redisClient = createRedisClient()
	this._redisPublisher = createRedisClient()
	this._redisSubscriber = createRedisClient()

	// relay messages on Global chat
	this._redisSubscriber.subscribe('Global')
	this._redisSubscriber.on('message', function(_ch, payload) {
		var message = JSON.parse(payload)
		if (message.from === 'server')
			return;
		that.postToSlack(message.username+': '+message.message)
	})

	this._serialNumber = new SerialNumber(this._redisClient)

	this._bot = new SlackBot({
		token: process.env.SLACKBOT_TOKEN,
		name: 'Vizor'
	})
	
	this._bot.once('start', function() {
		var userMap = {}
		var channelId

		that._bot.getUsers().then(function(users) {
			users.members.forEach(function(user) {
				userMap[user.id] = user.name
			})
		})

		that._bot.getChannels().then(function(channels) {
			channels.channels.map(function(channel) {
				if (channel.name === CHANNEL)
					channelId = channel.id
			})
		})

		that._bot.on('message', function(data) {
			switch(data.type) {
				case 'message':
					if (data.bot_id)
						return;

					if (data.channel !== channelId)
						return;

					if (shouldDrop(data.text))
						return;

					var text = filterText(data.text)

					console.log('IN:', userMap[data.user], data)

					that.postToVizor(userMap[data.user], text)
					break;

				case 'hello':
					that.postToSlack('I\'ve been reloaded!')
					break;

				default:
					if (data.type === 'user_typing')
						return;

					console.log('INFO', userMap[data.user], data.type, data)

					break;
			}
		})
	})
}

VizorSlackBot.prototype.close = function(err) {
	if (err)
		console.error(err)

	this._bot.ws.close()
	this._redisClient.end()
	this._redisSubscriber.end()
	this._redisPublisher.end()
}

VizorSlackBot.prototype.postToVizor = function(asUserName, text) {
	var that = this

	var channel = 'Global'
	var action = {
		actionType: 'uiChatMessageAdded',
		channel: channel,
		from: 'server',
		username: asUserName,
		message: text
	}

	this._serialNumber.next(channel)
	.then(function(serial) {
		var payload = {
			id: serial,
			date: Date.now(),
			log: JSON.stringify(action)
		}

		that._redisPublisher.zadd(channel, serial, JSON.stringify(payload), function(err) {
			if (err)
				console.error('REDIS WRITE FAILED', err.stack)
		
			var message = action
			message.id = payload.id
			message.date = payload.date

			that._redisPublisher.publish(channel, JSON.stringify(message))
		})
	})
}

VizorSlackBot.prototype.postToSlack = function(text) {
	console.log('OUT:', text)

	return this._bot.postTo(CHANNEL, text)
		.fail(this.close.bind(this))
}

var bot = new VizorSlackBot()

