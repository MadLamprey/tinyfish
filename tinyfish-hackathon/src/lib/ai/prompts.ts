export const platformStrategyPrompt = `
Platform strategies:
- Instagram: instagram.com/explore/tags/{city}{interest}/ | stealth | Use proxy
- TikTok: tiktok.com/search?q={city}+{interest} | stealth | Use proxy
- Reddit: reddit.com/r/{subreddit}/search/?q={query} | lite | City subs
- Lemon8: lemon8-app.com/search?q={city}+{interest} | stealth | Strong for Asia
- TimeOut: timeout.com/{city}/things-to-do | lite | Editorial
- Infatuation: theinfatuation.com/{city} | lite | Restaurant focus
- Google Maps: google.com/maps/search/{interest}+in+{city} | stealth | Hours + ratings
- Tripadvisor: tripadvisor.com/Search?q={city}+{interest} | stealth | Activities

Goal templates:
- Instagram: Extract top 15 posts. For each: { caption, location_name, username, engagement_approx, image_url }
- TikTok: Extract top 10 video results. For each: { title, creator, views, description, url }
- Reddit: Extract top 10 posts and their top 3 comments. For each: { title, body, score, top_comments: [{ text, score }] }
- Lemon8: Extract top 10 posts. For each: { title, content_summary, author, tags, image_urls }
- TimeOut: Extract top 15 recommended things to do. For each: { name, category, description, address, price_range }
- Infatuation: Extract restaurant recommendations. For each: { name, cuisine, neighborhood, price_level, summary, rating }
- Google Maps: Extract top 10 places. For each: { name, rating, review_count, address, category, price_level }
- Tripadvisor: Extract top 10 results. For each: { name, rating, review_count, type, price_range, description }

Dynamic selection:
- clubbing -> Instagram, Reddit, TimeOut, TikTok
- surfing -> Instagram, Reddit, TikTok, Google Maps
- foodie -> Instagram, Lemon8, Infatuation, TimeOut, Reddit, Google Maps
- hidden gems -> heavily weight Reddit and Lemon8
`;
