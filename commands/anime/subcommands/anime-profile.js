const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('@discordjs/builders');
const { ButtonStyle } = require('discord.js');
const malScraper = require('mal-scraper');

module.exports = {
    async animeProfile(interaction) {
        await interaction.deferReply('Loading...');

        const username = interaction.options.getString('username');
        let paginate = 0; // index of data entry point
        const type = 'anime';

        let data;
        let currentPage = 1;
        let totalPages = 1;

        /* DATA LOGIC */
        try {
            // gets an array of 300 values
            data = await malScraper.getWatchListFromUser(username, paginate, type);
        }
        catch (error) {
            console.log(`%s %s An error occured while awaiting a reply.\n${error}`, '\x1b[41m ERROR \x1b[0m', '\x1b[34m [anime-search.js] \x1b[0m');
            return interaction.reply('An error occured while processing your request.');
        }

        totalPages = Math.floor(data.length / 8);

        const embed = new EmbedBuilder()
            .setColor(0xF5B5C8)
            .setTitle(`${username}'s profile`)
            .setDescription('Displays all user\'s anime alphabetically from `watching > completed > on-hold > dropped > plan-to-watch`')
            .setURL(`https://myanimelist.net/profile/${username}`)
            .setFooter({ text: `page ${currentPage} of ${totalPages}` });

        // populates initial page
        updatePage(embed, data, paginate);

        /* BUTTON LOGIC */
        const filter = i => {
            if (i.customId === 'anime-profile-prev' && i.user.id === interaction.user.id) {
                currentPage--;
                paginate -= 8;
                updatePage(embed, data, paginate);
                embed.setFooter({ text: `page ${currentPage} of ${totalPages}` });
                return i.customId === 'anime-profile-prev';
            }
            else if (i.customId === 'anime-profile-next' && i.user.id === interaction.user.id) {
                currentPage++;
                paginate += 8;
                updatePage(embed, data, paginate);
                embed.setFooter({ text: `page ${currentPage} of ${totalPages}` });
                return i.customId === 'anime-profile-next';
            }
        };

        /* REPLY FORMATTING */
        const row = buildButton();

        // const collector = interaction.channel.createMessageComponentCollector({ filter, time: 1800000 });
        // collector.on('collect', async i => {
        //     await i.update({ embeds: [embed], components: [row] });
        // });

        await interaction.editReply({ embeds: [embed], components: [row] });
    },
};

function getURL(nData) {
    const id = nData.animeId;
    const name = nData.animeTitle.replaceAll(' ', '_');
    return `https://myanimelist.net/anime/${id}/${name}`;
}

function getStatus(nData) {
    switch (nData.status) {
        case 1:
            return 'Watching';
        case 2:
            return 'Completed';
        case 3:
            return 'On-hold';
        case 4:
            return 'Dropped';
        case 6: // idk where status 5 is /shrug
            return 'Plan-to-watch';
    }
}

function buildButton() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('anime-profile-prev')
                .setLabel('<')
                .setStyle(ButtonStyle.Secondary),
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId('anime-profile-next')
                .setLabel('>')
                .setStyle(ButtonStyle.Secondary),
        );
}

function updatePage(embed, data, paginate) {
    // Empties all embed fields for new ones to be added
    embed.setFields();
    for (let i = paginate; i < paginate + 8; i++) {
        embed.addFields({ name: `${data[i].animeTitle}`, value: `[MyAnimeList Page](${getURL(data[i])})\nAired: ${data[i].animeStartDateString}\n${data[i].animeNumEpisodes} episode(s)`, inline: true });
        embed.addFields({ name: '\u200B\u200B', value: '\u200B\u200B', inline: true });
        embed.addFields({ name: `User Rating: ${data[i].score} ★`, value: `Status: ${getStatus(data[i])}`, inline: true });
    }
}