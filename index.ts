import type { Database } from "@cloudflare/d1";

interface Env {
    DB: Database,
    API_KEY: string
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {

        const url = new URL(request.url);

        if (url.pathname.startsWith("/d1")) {

            if (request.headers.get("API-KEY") !== env.API_KEY) {
                return new Response("No valid 'API-KEY' in request headers.", {
                    headers: { "Content-Type": "text/plain" },
                    status: 401
                });
            }

            // Operations with the users table
            if (url.pathname === "/d1/users") {
                if (request.method === "POST") {
                    try {

                        const { userId, username, language } = await request.json();
                        const { results } = await env.DB.prepare(`SELECT 1 FROM users WHERE user_id = ${userId}`).all();

                        if (!results?.length) {
                            console.log(`No column with WHERE user_id === "${userId}", creating new column.`);
                            await env.DB.exec(`INSERT INTO users (user_id, username, last_stats_sent, last_language, total_stats_sent) VALUES ("${userId}", "${username}", ${new Date().getTime()}, "${language}", 1)`);
                            return new Response("Created new column.");
                        } else {
                            console.log(`Found column WHERE user_id === "${userId}", updating column.`);
                            await env.DB.exec(`UPDATE users SET username = "${username}", last_stats_sent = ${new Date().getTime()}, last_language = "${language}", total_stats_sent = total_stats_sent + 1 WHERE user_id = "${userId}"`);
                            return new Response("Updated column.");
                        }

                    } catch (error) {
                        console.log(error.cause);
                        return new Response(error.toString(), { status: 500 });
                    }

                } else if (request.method === "GET") {
                    const query = request.headers.get("D1-Query");
                    const { results } = await env.DB.prepare(query ?? "SELECT * FROM users").all();
                    return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
                }
            }

            // Operations with the output table
            if (url.pathname === "/d1/output") {
                if (request.method === "POST") {
                    try {

                        const { userId, username, guildName, guildId, channelName, channelId, game, segment, language, messageURL, imageURL } = await request.json();

                        await env.DB.exec(`INSERT INTO output (user_id, username, guild_name, guild_id, channel_name, channel_id, game, segment, language, date, message_url, image_url) VALUES ("${userId}", "${username}", "${guildName}", "${guildId}", "${channelName}", "${channelId}", "${game}", "${segment}", "${language}", ${new Date().getTime()}, "${messageURL}", "${imageURL}")`);
                        return new Response("Created new column with output.");

                    } catch (error) {
                        console.log(error.cause);
                        return new Response(error.toString(), { status: 500 });
                    }

                } else if (request.method === "GET") {
                    const query = request.headers.get("D1-Query");
                    const { results } = await env.DB.prepare(query ?? "SELECT * FROM output").all();
                    return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
                }
            }

        }
        return new Response("Not found.");
    }
}