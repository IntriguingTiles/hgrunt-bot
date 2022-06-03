# hgrunt-bot
This is a discord.js bot that can play hgrunt/VOX lines in a voice channel, generate HDTF banners, get garfield comics, and more.

[Add HGrunt](https://discord.com/api/oauth2/authorize?client_id=396884008501510144&permissions=0&scope=bot%20applications.commands)

# Support
Join [HGrunt Hangout](https://discord.gg/trWuQMv).

# Running your own instance
```
git clone https://github.com/IntriguingTiles/hgrunt-bot.git
cd hgrunt-bot
mkdir gmg
mkdir jon
mkdir voice
cd voice
mkdir hgrunt
mkdir vox
mkdir metropolice
mkdir combine_soldier
mkdir overwatch
cd ..
npm install
```
Now just put your token in the `DISCORD_TOKEN` environment variable and you should be good to go.

If you want `!say` to work, grab the audio files for `hgrunt` and `vox` from Half-Life 1 and `metropolice`, `combine_soldier`, and `overwatch` from Half-Life 2. You'll also need FFmpeg.

If you want `!gmg` to work, you'll have to scrape images from [garfield minus garfield](http://garfieldminusgarfield.net/) and place them in `gmg`.

If you want `!jon` to work, you'll have to painstakingly screenshot comics from [this PDF](https://drive.google.com/file/d/1e6qIhEusfMgSJ9-e_R-Vgh4Vrlq93-aw/view), name them the date in ISO 8601 format, and place them in `jon`.

# Credits
- Miloteza#7639 for the custom VOX lines
- HeadCrabbed#1477 for the HDTF character set
- NetwideRogue#0908 for the sqrt command
