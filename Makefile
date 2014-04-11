test:
	./node_modules/.bin/mocha \
		--harmony \
		--timeout 60000 \
		--reporter spec \
		test/test.js

.PHONY: test
