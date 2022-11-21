import type { Env, UsersPayload, OutputPayload } from "./types";

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

                        const { userId, username, language }: UsersPayload = await request.json();

                        // Insert a new user. If there is a conflict (user_id already exists), then update the existing row
                        await env.DB.prepare(`
                        INSERT INTO users (user_id, username, last_stats_sent, last_language, total_stats_sent) 
                        VALUES (?1, ?2, ?3, ?4, 1) 
                        ON CONFLICT (user_id) DO UPDATE SET username = ?2, last_stats_sent = ?3, last_language = ?4, total_stats_sent = total_stats_sent + 1 
                        WHERE user_id = ?1
                        `).bind(userId, username, new Date().getTime(), language).run();

                        return new Response("POST /d1/users OK");

                    } catch (e) {
                        console.log({ message: e.message, cause: e.cause?.message });
                        return Response.json({ message: e.message, cause: e.cause?.message }, { status: 500 });
                    }

                } else if (request.method === "GET") {
                    const query = request.headers.get("D1-Query");
                    const { results } = await env.DB.prepare(query ?? "SELECT * FROM users").all();
                    return Response.json(results);
                }
            }

            // Operations with the output table
            if (url.pathname === "/d1/output") {
                if (request.method === "POST") {
                    try {

                        const { userId, username, guildName, guildId, game, segment, language, messageURL, imageURL }: OutputPayload = await request.json();

                        await env.DB.prepare(`INSERT INTO output (user_id, username, guild_name, guild_id, game, segment, language, date, message_url, image_url) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`).bind(userId, username, guildName, guildId, game, segment, language, new Date().getTime(), messageURL, imageURL).run();

                        return new Response("POST /d1/output OK");

                    } catch (e) {
                        console.log({ message: e.message, cause: e.cause?.message });
                        return Response.json({ message: e.message, cause: e.cause?.message }, { status: 500 });
                    }

                } else if (request.method === "GET") {
                    const query = request.headers.get("D1-Query");
                    const { results } = await env.DB.prepare(query ?? "SELECT * FROM output").all();
                    return Response.json(results);
                }
            }

        }
        return new Response("Not found.");
    }
}