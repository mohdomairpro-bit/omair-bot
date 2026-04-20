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

function swapEmoji(channelName, newEmoji) {
  const chars = [...channelName];
  chars[0] = newEmoji;
  return chars.join("");
}

function countLockingOverwrites(channel) {
  let count = 0;
  for (const [, overwrite] of channel.permissionOverwrites.cache) {
    if (overwrite.deny.has(PermissionFlagsBits.SendMessages)) {
      count++;
    }
  }
  return count;
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

    // Fetch latest audit log for permission overwrites
    const auditLogs = await newChannel.guild.fetchAuditLogs({
      type: AuditLogEvent.ChannelOverwriteUpdate,
      limit: 5,
    });

    // Find the most recent entry for this specific channel
    const entry = auditLogs.entries.find((e) => e.target?.id === newChannel.id);

    let lockedViaAudit = null;

    if (entry) {
      const changes = entry.changes;
      for (const change of changes) {
        // Look for deny bits changing - SendMessages permission value is 2048n
        if (change.key === "deny") {
          const oldDeny = BigInt(change.old ?? 0);
          const newDeny = BigInt(change.new ?? 0);
          const sendMessages = PermissionFlagsBits.SendMessages;

          const wasDenied = (oldDeny & sendMessages) === sendMessages;
          const isDenied = (newDeny & sendMessages) === sendMessages;

          if (!wasDenied && isDenied) {
            lockedViaAudit = true;
            break;
          } else if (wasDenied && !isDenied) {
            lockedViaAudit = false;
            break;
          }
        }
      }
    }

    // Fall back to overwrite count method if audit log didn't give a clear answer
    const oldCount = countLockingOverwrites(oldChannel);
    const newCount = countLockingOverwrites(newChannel);

    const isLocking = lockedViaAudit !== null ? lockedViaAudit : newCount > oldCount;
    const isUnlocking = lockedViaAudit !== null ? lockedViaAudit === false : newCount < oldCount;

    console.log(`📡 #${channelName} | auditResult: ${lockedViaAudit} | oldCount: ${oldCount} | newCount: ${newCount}`);

    let newName = channelName;

    if (isLocking) {
      newName = swapEmoji(channelName, LOCKED_EMOJI);
      console.log(`🔒 Locking → #${newName}`);
    } else if (isUnlocking) {
      newName = swapEmoji(channelName, OPEN_EMOJI);
      console.log(`🔓 Unlocking → #${newName}`);
    } else {
      console.log("⏭️ No lock/unlock detected, skipping");
      return;
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
