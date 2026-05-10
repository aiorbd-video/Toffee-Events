export default {
  async fetch(request) {

    const url = new URL(request.url);

    // OPEN ROOT
    if (url.pathname === "/") {
      return new Response(
        "Use /playlist.m3u",
        {
          headers: {
            "content-type": "text/plain"
          }
        }
      );
    }

    // PLAYLIST ONLY
    if (url.pathname !== "/playlist.m3u") {
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
          "Source fetch failed",
          {
            status: 502
          }
        );
      }

      const text = await response.text();

      const lines = text.split("\n");

      const output = [];

      const seen = new Set();

      let total = 0;

      const now = new Date().toLocaleString(
        "en-BD",
        {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        }
      );

      output.push("#EXTM3U");
      output.push(`#LAST-UPDATED: ${now}`);
      output.push("");

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

        output.push(line);

        let j = i + 1;

        while (
          j < lines.length &&
          !lines[j].startsWith("#EXTINF")
        ) {

          const current = lines[j];

          // REMOVE DUPLICATE LINKS
          if (current.startsWith("http")) {

            if (seen.has(current)) {
              j++;
              continue;
            }

            seen.add(current);
          }

          output.push(current);

          j++;
        }

        output.push("");

        total++;

        i = j - 1;
      }

      output.splice(
        1,
        0,
        `#TOTAL-VS-MATCHES: ${total}`
      );

      return new Response(
        output.join("\n"),
        {
          headers: {
            // FORCE TEXT OUTPUT
            "content-type":
              "text/plain; charset=utf-8",

            // STOP INLINE VIDEO PLAY
            "Content-Disposition":
              'attachment; filename="playlist.m3u"',

            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );

    } catch (err) {

      return new Response(
        "Error: " + err.message,
        {
          status: 500
        }
      );

    }
  }
};
