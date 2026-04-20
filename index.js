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

// Properly replaces first emoji using Unicode-aware spread
function swapEmoji(channelName, newEmoji) {
  const chars = [...channelName]; // splits correctly by Unicode code points
  chars[0] = newEmoji;
  return chars.join("");
}

// Check if ANY overwrite in the channel denies SendMessages
function isChannelLocked(channel) {
  for (const [, overwrite] of channel.permissionOverwrites.cache) {
    if (overwrite.deny.has(PermissionFlagsBits.SendMessages)) {
      return true;
    }
  }
  return false;
}
// ----------------

client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

client.on("channelUpdate", async (oldChannel, newChannel) => {
  try {
    const channelName = newChannel.name;

    const isWatched = WATCHED_CHANNELS.some((name) => channelName.includes(name));
    if (!isWatched) return;

    const wasLocked = isChannelLocked(oldChannel);
    const isLocked = isChannelLocked(newChannel);

    console.log(`📡 #${channelName} | wasLocked: ${wasLocked} | isLocked: ${isLocked}`);

    if (wasLocked === isLocked) return;

    let newName = channelName;

    if (isLocked && !wasLocked) {
      newName = swapEmoji(channelName, LOCKED_EMOJI);
      console.log(`🔒 Locking → #${newName}`);
    } else if (!isLocked && wasLocked) {
      newName = swapEmoji(channelName, OPEN_EMOJI);
      console.log(`🔓 Unlocking → #${newName}`);
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
