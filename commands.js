const { REST, Routes, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

const commands = [
  new SlashCommandBuilder()
    .setName("promote")
    .setDescription("Promote a member to the next rank")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The member to promote")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason for promotion")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("demote")
    .setDescription("Demote a member to the previous rank")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The member to demote")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason for demotion")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("⏳ Registering slash commands...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Slash commands registered successfully!");
  } catch (error) {
    console.error(error);
  }
})();
