pm2 start main.js -i 2

pm2 reload main --update-env

pm2_run_server

pm2 start main.js --watch --node-args="--harmony" -i 2

pm2 delete main