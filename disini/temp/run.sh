#!/bin/bash
cd /root/botwa

# Kill proses node bot.js yang lama (pake --exclude-pgrp biar gak bunuh diri)
pkill -9 -f "node bot.js"

# Gas pake path node lo yang asli (pastiin ini hasil dari 'which node')
$(which node) bot.js
