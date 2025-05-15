# liine-takehome

## Overview

TODO: summarize approach, process, and outcomes

## Work log

- May 14 | 30min | Initial server and logic scaffolding
- May 14 | 1.5h | Hour range parsing and tests, planning lookup logic
- May 15 | 1h | Implement lookup, more tests, manual testing
- May 15 | 30m | Wrap up, CSV parsing bugfixes

## Process

For takehomes I like to sketch out my thoughts and take notes in the README as I go, so here's that. This is me transcribing the way I think as I go. Sometimes on particularly hard problems I will do this and either throw it away once I'm done or turn it into documentation or a blog post if it's worthwhile.

### Initial problem impressions

This seems like a pretty simple assignment, with two main challenges: parsing the hours string resiliently, and deciding how to index restaurants to be looked up with some arbitrary time later.

I'm assuming other considerations, like scaling to large numbers of restaurants, updating the list, etc are out of scope.

Functionally I need: an HTTP server, loading a CSV from file, appropriate datastructure(s) to store the restaurants in memory for retrieval... I think that's about it. Validation for API inputs, too.

Since I'm by far the most comfortable with Typescript, I'm opting to implement with it. I think I could probably take a swing at this with Python, but I'd spend a lot more time looking up stlib and tooling I've forgotten than writing code, probably.

I'm planning on using my favorite HTTP setup, Hono + Zod, which covers request handling and validation and has excellent type support.

For the two core problems I identified, I'll probably do some TDD to make sure I get the details right. Particular for parsing problems I find it's easier to just start with tests.

After setting up some basic scaffolding I'll dig into the hard problems.

### Parsing notes

Ok, the first thing I'm seeing on inspecting the CSV is the inconsistency of the format! Let's see if I can take an inventory of how things are represented.

- Time: `h am/pm`, `h:mm am/pm`, `h am/pm`
- Day: Consistent 3-letter shorthand, first letter capitalized
- Day ranges: Consecutive ranges are `Day-Day`, followed by time. Non-consecutive groupings of days with same times use `Day, Day` (or combine with ranges).
- Alternate times: If a restaurant has multiple time windows on different days or ranges of days, they're separated by `/`.

My list goes from fine to coarse granularity, so I'd probably reverse that for parsing: start by separating Day+Time groupings, then split to days (or day ranges), then process time range.

One thing conspicuously absent here is multiple discontinuous time ranges on the same day, which is common for restaurants (lunch and dinner hours), but since it's not represented in the examples I suppose I'll exclude the possibility. There's no way to confidently speculate what the syntax would be. But if this were my product I'd have addressed that in design phase 😉

I'll probably also loosen up the casing requirements, even though casing is consistent in examples, cause why not.

#### Output format

To start with, any discrete search time will by definition only be on one particular day of the week. If I want to know the restaurant is open on Monday at 11 am, I don't care about its hours on Tuesday. That's a pretty good inherent partitioning tool.

So I can expand `Mon-Sat 11 am - 11 pm` into `Mon 11 am - 11 pm`, `Tue 11 am - 11 pm` ... and so on, bucketing these by day for lookup later. This adds a maximum of N\*7 items to the total search space, but then divides the search time by 7 (since hash lookups are constant time), leading to marginal improvement versus naive scanning.

I suppose I could do a similar thing with the times, but this gets trickier. I could explode every time range into discrete `hh:mm` values for constant time lookup again... but that's a much larger factor (worst case 24\*60=1200 I think?). Then again, each entry is not very large, so memory cost doesn't seem so prohibitive here.

Since input time format is not specified, I have to assume it may include seconds. So I'd need to lookup the top and bottom of the minute to be sure they're both included in the range. O(4), ish (much depends on JS' underlying hash lookup here). Pretty good? Is the memory use worth it? I'll go with 'probably.'

This approach is roughly inspired by spatial hashing from videogames, which I've always liked. Divide and conquer your search space.

### Lookup and testing

Alright, with parsing out of the way, I moved on to lookup tables using the approach outlined above.

The sheer number of entries in this table is pretty big. 154191 total name entries for 40 restaurants! That's 1 value for every minute every restaurant in the set is open. Most of those are duplicates of the same name spread across all those minutes. The total memory size is around 3MB, which is huge compared to the original dataset. I imagine that size will grow linearly with number of entries, averaging for their total open hours.

So! Am I happy with that? For a dataset this small, it's kind of moot. I'm leaning hard toward the time side of the time vs memory performance axis, for sure. I've certainly gained a bit more intuition on when this kind of hash partitioning is a good fit.

How I might think about improving the approach... obviously a good way to reduce memory usage is to start offloading to disk. Instead of loading an in-memory table, I could write separate files for each day of the week, then load those files into memory as needed for each query.

Of course, what I'm doing at that point is basically inventing a database. So what I'd _actually_ do, if this weren't an exercise (and, honestly, what I would have done from the start) is push this data into SQLite and leverage how it's already solved most of these problems.

My schema would probably look something like:

```sql
CREATE TABLE restaurant_hour_range (
	id INTEGER PRIMARY KEY,
	restaurant_name TEXT,
	day TEXT,
	start_time_minutes TEXT,
	end_time_minutes TEXT
);
CREATE INDEX restaurant_hour_range_day ON restaurant_hour_range(day);
CREATE INDEX restaurant_hour_range_start_time ON restaurant_hour_range(start_time_minutes);
CREATE INDEX restaurant_hour_range_end_time ON restaurant_hour_range(end_time_minutes);
```

Then I could do a query like:

```sql
SELECT restaurant_name
FROM restaurant_hour_range
WHERE day = 'Mon'
AND start_time_minutes <= 660
AND end_time_minutes >= 660
```

All that seems pretty good to me. Not sure the range scan will be as time efficient as the constant time lookup table I have, but it's probably worth it to keep memory under control if this was going to scale to thousands of restaurants.

The reason I wasn't keen on doing this for this exercise (and still probably won't) is mostly the boilerplate of setting up the database, migrations, and seeding the data, avoiding writing duplicate entries upon successive startups, etc, etc. This is all pedestrian and worth doing in a real project, but seemed overkill; hopefully this writeup makes it clear I'm aware of the option and could implement it.

### Other fun

I had initially assumed parsing this simple CSV would be a matter of splitting on commas (it's right in the name!) but of course CSV parsing is kind of like time, in that it's hubris to think it'll be simple and easy. It's been a minute since I tried to parse a CSV but it's all coming back to me.

Similar to "just use SQLite" I would probably "just use a library" here, particularly on a real project where there is a good chance the requirements will change over time and a brittle solution will fail. This time, since that's a very easy thing to drop in, I'm going to go ahead and do that.
