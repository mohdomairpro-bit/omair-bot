const { Client, GatewayIntentBits, PermissionFlagsBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ---- CONFIG ----
const TOKEN = process.env.TOKEN;

const WATCHED_CHANNELS = [
  "》tirex-bibass",
  "》vortix-bipass",
  "》difzz-bipass",
  "》userscripts",
];

const LOCKED_EMOJI = "🔴";
const OPEN_EMOJI = "🟢";

function swapEmoji(channelName, newEmoji) {
  return channelName.replace(/^\p{Emoji_Presentation}/u, newEmoji);
}
// ----------------

client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

client.on("channelUpdate", async (oldChannel, newChannel) => {
  try {
    const channelName = newChannel.name;
    console.log(`📡 channelUpdate fired for: #${channelName}`);

    // Only watch our 4 specific channels
    const isWatched = WATCHED_CHANNELS.some((name) => channelName.includes(name));
    console.log(`👀 Is watched: ${isWatched}`);
    if (!isWatched) return;

    const everyoneRole = newChannel.guild.roles.everyone;

    const oldCanSend = oldChannel.permissionsFor(everyoneRole)?.has(PermissionFlagsBits.SendMessages);
    const newCanSend = newChannel.permissionsFor(everyoneRole)?.has(PermissionFlagsBits.SendMessages);

    console.log(`🔑 oldCanSend: ${oldCanSend}, newCanSend: ${newCanSend}`);

    if (oldCanSend === newCanSend) {
      console.log("⏭️ No permission change, skipping");
      return;
    }

    let newName = channelName;

    if (!newCanSend && oldCanSend) {
      newName = swapEmoji(channelName, LOCKED_EMOJI);
      console.log(`🔒 Locking: #${channelName} → #${newName}`);
    } else if (newCanSend && !oldCanSend) {
      newName = swapEmoji(channelName, OPEN_EMOJI);
      console.log(`🔓 Unlocking: #${channelName} → #${newName}`);
    }

    if (newName !== channelName) {
      await newChannel.setName(newName);
      console.log(`✅ Renamed successfully`);
    }
  } catch (err) {
    console.error("❌ Error:", err);
  }
});

client.login(TOKEN);
