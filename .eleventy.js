const Terser = require("terser");
const emojiRegex = require("emoji-regex");
const { DateTime } = require("luxon");
const slugify = require("slugify");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const topics = require("./src/_data/topics");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addWatchTarget("./src/sass/");

  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addPassthroughCopy("./src/fonts");
  eleventyConfig.addPassthroughCopy("./src/img");
  eleventyConfig.addPassthroughCopy("./src/favicon.png");

  eleventyConfig.addFilter("slug", (str) => {
    const regex = emojiRegex();
    // Remove Emoji first
    let string = str.replace(regex, "");

    return slugify(string, {
      lower: true,
      replacement: "-",
      remove: /[*+~.·,()'"`´%!?¿:@\/]/g,
    });
  });

  eleventyConfig.addFilter("jsmin", (code) => {
    let minified = Terser.minify(code);
    if (minified.error) {
      console.log("Terser error: ", minified.error);
      return code;
    }

    return minified.code;
  });

  eleventyConfig.addCollection("sortByDate", function (collection) {
    return collection.getFilteredByTag("posts").sort((a, b) => {
      return b.data.post.episode - a.data.post.episode;
    });
  });

  eleventyConfig.addFilter("jsonTitle", (str) => {
    let title = str.replace(/((.*)\s(.*)\s(.*))$/g, "$2&nbsp;$3&nbsp;$4");
    title = title.replace(/"(.*)"/g, '\\"$1\\"');
    return title;
  });

  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  eleventyConfig.addShortcode("peekaboo", (index) => {
    const randomIndex = Math.floor(Math.random() * 5);
    if (randomIndex === index) {
      return "tdbc-peekaboo";
    }
    return "";
  });

  eleventyConfig.addShortcode("upcomingTopic", (index) => {
    const nextIndex = index + 1;
    const nextTopic = topics[nextIndex];

    if (nextTopic !== undefined) {
      return `<li class="tdbc-card tdbc-card--teaser">
          <div class="tdbc-card__content tdbc-text-align-center">
            <span class="tdbc-lead tdbc-my-auto">Upcoming Topic: <br/><span class="tdbc-h3 tdbc-ink--secondary">${nextTopic}</span></span>
          </div>
        </li>`;
    }

    return "";
  });

  eleventyConfig.addFilter("postDate", (dateObj) => {
    return DateTime.fromISO(dateObj, {
      zone: "America/Chicago",
    }).toLocaleString(DateTime.DATE_MED);
  });

  eleventyConfig.addFilter("postRssDate", (dateObj) => {
    return DateTime.fromISO(dateObj).toISO({
      includeOffset: true,
      suppressMilliseconds: true,
    });
  });

  eleventyConfig.addNunjucksFilter("rssLastUpdatedDate", (collection) => {
    if (!collection || !collection.length) {
      throw new Error("Collection is empty in rssLastUpdatedDate filter.");
    }

    // Newest date in the collection
    return DateTime.fromISO(collection[0].data.post.date).toISO({
      includeOffset: true,
      suppressMilliseconds: true,
    });
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromISO(dateObj, {
      zone: "utc",
    }).toFormat("yyyy-LL-dd");
  });

  eleventyConfig.addFilter("randomLimit", (arr, limit, currPage) => {
    const pageArr = arr.filter((page) => page.url !== currPage);
    pageArr.sort(() => {
      return 0.5 - Math.random();
    });
    return pageArr.slice(0, limit);
  });

  return {
    passthroughFileCopy: true,
    dir: {
      input: "src",
      output: "public",
    },
  };
};
