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

    // Only watch our 4 specific channels
    const isWatched = WATCHED_CHANNELS.some((name) => channelName.includes(name));
    if (!isWatched) return;

    const everyoneRole = newChannel.guild.roles.everyone;

    // Check the FINAL computed permissions for @everyone (works for any bot)
    const oldCanSend = oldChannel.permissionsFor(everyoneRole)?.has(PermissionFlagsBits.SendMessages);
    const newCanSend = newChannel.permissionsFor(everyoneRole)?.has(PermissionFlagsBits.SendMessages);

    // No change, ignore
    if (oldCanSend === newCanSend) return;

    let newName = channelName;

    if (!newCanSend && oldCanSend) {
      // Channel just got locked → go red
      newName = swapEmoji(channelName, LOCKED_EMOJI);
      console.log(`🔒 Locked: #${channelName} → #${newName}`);
    } else if (newCanSend && !oldCanSend) {
      // Channel just got unlocked → go green
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
