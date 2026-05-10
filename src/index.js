export default {
  async fetch(request) {

    const url = new URL(request.url);

    if (url.pathname !== "/playlist.json") {
      return new Response("Not Found", {
        status: 404
      });
    }

    const SOURCE =
      "https://cdn-toffee-playlist.pages.dev/ott_navigator.m3u";

    try {

      const response = await fetch(SOURCE);

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            error: "Source fetch failed"
          }),
          {
            status: 502,
            headers: {
              "content-type": "application/json"
            }
          }
        );
      }

      const text = await response.text();

      const lines = text.split("\n");

      const channels = [];

      const seen = new Set();

      const updated = new Date().toLocaleString(
        "en-BD",
        {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        }
      );

      for (let i = 0; i < lines.length; i++) {

        const line = lines[i];

        if (!line.startsWith("#EXTINF")) {
          continue;
        }

        const lower = line.toLowerCase();

        // ONLY VS MATCHES
        const isVsMatch =
          lower.includes(" vs ") ||
          lower.includes("vs.");

        if (!isVsMatch) {
          continue;
        }

        // CHANNEL NAME
        const name =
          line.split(",").pop()?.trim() ||
          "Unknown";

        let stream = "";

        let j = i + 1;

        while (
          j < lines.length &&
          !lines[j].startsWith("#EXTINF")
        ) {

          const current = lines[j].trim();

          if (
            current.startsWith("http")
          ) {
            stream = current;
            break;
          }

          j++;
        }

        if (!stream) {
          continue;
        }

        if (seen.has(stream)) {
          continue;
        }

        seen.add(stream);

        channels.push({
          name,
          stream
        });

        i = j - 1;
      }

      return new Response(
        JSON.stringify(
          {
            updated,
            total: channels.length,
            channels
          },
          null,
          2
        ),
        {
          headers: {
            "content-type":
              "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );

    } catch (err) {

      return new Response(
        JSON.stringify({
          error: err.message
        }),
        {
          status: 500,
          headers: {
            "content-type":
              "application/json"
          }
        }
      );

    }
  }
};
