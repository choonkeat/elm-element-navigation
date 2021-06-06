run:
	npx elm-live src/Main.elm   \
		--open \
		--start-page index.html \
		--pushstate             \
		-- --optimize --output output.js
