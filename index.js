const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once("ready", () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
});

// Random messages arrays
const promotionMessages = [
  "🎉 Awesome! {user} is now promoted from {old} to {new}! Due to his/her excellent performance in the staff work and his/her dedication towards the team. Keep it up!",
  "🏆 Congrats {user}! You’ve leveled up from {old} → {new}! Seeing your work and awareness in the team and your dedication towards your work, you are to be promoted. Aim higher!",
  "🔥 {user} moves up from {old} to {new}! Seeing your respectful work and your hardwork towardcs the team you are promoted. Respect!",
];

const demotionMessages = [
  "⚠️ {user} has been demoted from {old} to {new}. Make sure you follow the work guidlines and work hard. Time to improve!",
  "💔 {user} drops from {old} → {new}. Make sure you follow the work guidlines and be sure about your behaviour. Don’t lose hope!",
  "❌ {user} moves down from {old} to {new}. Make sure you learn from your mistakes and grew up higher. Learn and grow!",
];

// Get random message from array
function getRandomMessage(array, member, oldRole, newRole) {
  const msg = array[Math.floor(Math.random() * array.length)];
  return msg.replace("{user}", member.user.username)
            .replace("{old}", oldRole.name)
            .replace("{new}", newRole.name);
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    await interaction.deferReply();

    const guild = interaction.guild;
    const member = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason");

    if (!member) return interaction.editReply("❌ Member not found.");

    const config = JSON.parse(fs.readFileSync("roles.json", "utf8"));
    const allowed = interaction.member.roles.cache.some(r =>
      config.allowedPromoters.includes(r.name)
    );
    if (!allowed) return interaction.editReply("❌ You are not authorized to do this.");

    const rankRoles = guild.roles.cache
      .filter(r => r.name !== "@everyone" && r.editable)
      .sort((a, b) => a.position - b.position)
      .map(r => r);

    const currentIndex = rankRoles.findIndex(r => member.roles.cache.has(r.id));
    if (currentIndex === -1) return interaction.editReply("❌ Member has no rank role.");

    let oldRole, newRole, customMessage, embedColor = 0x00FFFF;

    if (interaction.commandName === "promote") {
      if (currentIndex >= rankRoles.length - 1) return interaction.editReply("❌ Member already has highest rank.");
      oldRole = rankRoles[currentIndex];
      newRole = rankRoles[currentIndex + 1];

      // Top rank special highlight
      if (currentIndex + 1 === rankRoles.length - 1) embedColor = 0xFFD700; // gold
      customMessage = getRandomMessage(promotionMessages, member, oldRole, newRole);
    }

    if (interaction.commandName === "demote") {
      if (currentIndex <= 0) return interaction.editReply("❌ Member already has lowest rank.");
      oldRole = rankRoles[currentIndex];
      newRole = rankRoles[currentIndex - 1];
      customMessage = getRandomMessage(demotionMessages, member, oldRole, newRole);
    }

    await member.roles.remove(oldRole);
    await member.roles.add(newRole);

    const db = JSON.parse(fs.readFileSync("database.json", "utf8"));
    db.lastPromotionId++;
    const promotionId = `PR-${db.lastPromotionId}`;
    db.logs.push({
      id: promotionId,
      member: member.id,
      from: oldRole.name,
      to: newRole.name,
      reason,
      by: interaction.user.id,
      time: new Date().toISOString()
    });
    fs.writeFileSync("database.json", JSON.stringify(db, null, 2));

    const embed = new EmbedBuilder()
      .setTitle(interaction.commandName === "promote" ? "🎖 Promotion Issued" : "📉 Demotion Issued")
      .setDescription(customMessage)
      .setColor(embedColor)
      .addFields(
        { name: "Member", value: member.toString(), inline: true },
        { name: "From", value: oldRole.name, inline: true },
        { name: "To", value: newRole.name, inline: true },
        { name: "Reason", value: reason },
        { name: "Promotion ID", value: promotionId }
      )
      .setTimestamp();

    const logChannel = guild.channels.cache.find(c => c.name === "promotion-log");
    if (logChannel) logChannel.send({ embeds: [embed] });

    await interaction.editReply({ content: customMessage, embeds: [embed] });

  } catch (err) {
    console.error("❌ ERROR:", err);
    if (interaction.deferred) interaction.editReply("❌ An internal error occurred. Check bot console.");
  }
});

client.login(process.env.TOKEN)
  .then(() => console.log(`✅ Bot logged in as ${client.user.tag}`))
  .catch(err => console.error("❌ Login failed:", err));

// (Paste this at the *very end* of index.js)
const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Promotion Manager Bot is online!"));
app.listen(process.env.PORT || 3000, () =>
  console.log("🌐 Express server running")
);
