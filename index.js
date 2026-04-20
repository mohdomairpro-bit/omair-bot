const { Client, GatewayIntentBits, PermissionFlagsBits, AuditLogEvent } = require("discord.js");

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

// Track already-processed audit log entries to avoid duplicate handling
const processedEntries = new Set();

function swapEmoji(channelName, newEmoji) {
  const chars = [...channelName];
  chars[0] = newEmoji;
  return chars.join("");
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

    // Small delay to let audit log catch up
    await new Promise((r) => setTimeout(r, 1000));

    const auditLogs = await newChannel.guild.fetchAuditLogs({
      type: AuditLogEvent.ChannelOverwriteUpdate,
      limit: 5,
    });

    const entry = auditLogs.entries.find((e) => e.target?.id === newChannel.id);
    if (!entry) return;

    // Skip if we already handled this audit log entry
    if (processedEntries.has(entry.id)) {
      console.log(`⏭️ Already processed entry ${entry.id}, skipping`);
      return;
    }
    processedEntries.add(entry.id);

    // Clean up old entries to prevent memory leak (keep last 50)
    if (processedEntries.size > 50) {
      const first = processedEntries.values().next().value;
      processedEntries.delete(first);
    }

    // Check audit log for SendMessages deny change
    let lockedViaAudit = null;
    for (const change of entry.changes) {
      if (change.key === "deny") {
        const oldDeny = BigInt(change.old ?? 0);
        const newDeny = BigInt(change.new ?? 0);
        const sendMessages = PermissionFlagsBits.SendMessages;

        const wasDenied = (oldDeny & sendMessages) === sendMessages;
        const isDenied = (newDeny & sendMessages) === sendMessages;

        if (!wasDenied && isDenied) { lockedViaAudit = true; break; }
        if (wasDenied && !isDenied) { lockedViaAudit = false; break; }
      }
    }

    console.log(`📡 #${channelName} | auditResult: ${lockedViaAudit}`);
    if (lockedViaAudit === null) return;

    const newName = swapEmoji(channelName, lockedViaAudit ? LOCKED_EMOJI : OPEN_EMOJI);

    if (newName !== channelName) {
      await newChannel.setName(newName);
      console.log(`✅ Renamed → #${newName}`);
    }
  } catch (err) {
    console.error("❌ Error:", err);
  }
});

client.login(TOKEN);
