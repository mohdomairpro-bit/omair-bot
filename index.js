const { Client, GatewayIntentBits, PermissionFlagsBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ---- CONFIG ----
const TOKEN = process.env.TOKEN; // Set this as an env variable on Railway

// The base names of the 4 channels to watch (without the emoji prefix)
const WATCHED_CHANNELS = [
  "》tirex-bibass",
  "》vortix-bipass",
  "》difzz-bipass",
  "》userscripts",
];

const LOCKED_EMOJI = "🔴";
const OPEN_EMOJI = "🟢";

// Strips any leading emoji and replaces it with the new one
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

    // Only watch our 4 specific channels
    const isWatched = WATCHED_CHANNELS.some((name) => channelName.includes(name));
    if (!isWatched) return;

    // Get @everyone role
    const everyoneRole = newChannel.guild.roles.everyone;

    // Check old and new SendMessages permission for @everyone
    const oldPerms = oldChannel.permissionOverwrites.cache.get(everyoneRole.id);
    const newPerms = newChannel.permissionOverwrites.cache.get(everyoneRole.id);

    const wasLocked = oldPerms?.deny.has(PermissionFlagsBits.SendMessages);
    const isLocked = newPerms?.deny.has(PermissionFlagsBits.SendMessages);

    // No change in lock state, ignore
    if (wasLocked === isLocked) return;

    let newName = channelName;

    if (isLocked && !wasLocked) {
      // Channel just got locked → always go red
      newName = swapEmoji(channelName, LOCKED_EMOJI);
      console.log(`🔒 Locked: #${channelName} → #${newName}`);
    } else if (!isLocked && wasLocked) {
      // Channel just got unlocked → always go green
      newName = swapEmoji(channelName, OPEN_EMOJI);
      console.log(`🔓 Unlocked: #${channelName} → #${newName}`);
    }

    if (newName !== channelName) {
      await newChannel.setName(newName);
    }
  } catch (err) {
    console.error("Error updating channel emoji:", err);
  }
});

client.login(TOKEN);
