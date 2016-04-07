var assert = require('assert')

var shouldDrop = require('../index').shouldDrop
var filterText = require('../index').filterText

describe('Filter', function() {
	it('should drop', function() {
		assert.ok(shouldDrop('<@U0D7U4WG3|jaakko> set the channel purpose: Foo.'))
		assert.ok(shouldDrop('foo bar <@U0D7U4WG3|jaakko> baz yea'))
		assert.ok(shouldDrop('kaarlo <@U0D7UV1QX|kaarlo> has joined the channel'))
		assert.ok(!shouldDrop('something strange has just happened'))
		assert.ok(!shouldDrop('something <strange> has just happened'))
		assert.ok(!shouldDrop('foo bar http://vizor.io/fthr/midtown-manhattan-flythrough-3 baz'))
	})

	it('should filter', function() {
		assert.equal('foo bar http://vizor.io/fthr/midtown-manhattan-flythrough-3 baz',
			filterText('foo bar <http://vizor.io/fthr/midtown-manhattan-flythrough-3> baz'))
	})

})

