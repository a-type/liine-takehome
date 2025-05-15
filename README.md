# liine-takehome

For takehomes I like to sketch out my thoughts and take notes in the README as I go, so here's that. This is me transcribing the way I think as I go. Sometimes on particularly hard problems I will do this and either throw it away once I'm done or turn it into documentation or a blog post if it's worthwhile.

## Initial problem impressions

This seems like a pretty simple assignment, with two main challenges: parsing the hours string resiliently, and deciding how to index restaurants to be looked up with some arbitrary time later.

I'm assuming other considerations, like scaling to large numbers of restaurants, updating the list, etc are out of scope.

Functionally I need: an HTTP server, loading a CSV from file, appropriate datastructure(s) to store the restaurants in memory for retrieval... I think that's about it. Validation for API inputs, too.

Since I'm by far the most comfortable with Typescript, I'm opting to implement with it. I think I could probably take a swing at this with Python, but I'd spend a lot more time looking up stlib and tooling I've forgotten than writing code, probably.

I'm planning on using my favorite HTTP setup, Hono + Zod, which covers request handling and validation and has excellent type support.

For the two core problems I identified, I'll probably do some TDD to make sure I get the details right. Particular for parsing problems I find it's easier to just start with tests.

After setting up some basic scaffolding I'll dig into the hard problems.

## Parsing notes

Ok, the first thing I'm seeing on inspecting the CSV is the inconsistency of the format! Let's see if I can take an inventory of how things are represented.

- Time: `h am/pm`, `h:mm am/pm`, `h am/pm`
- Day: Consistent 3-letter shorthand, first letter capitalized
- Day ranges: Consecutive ranges are `Day-Day`, followed by time. Non-consecutive groupings of days with same times use `Day, Day` (or combine with ranges).
- Alternate times: If a restaurant has multiple time windows on different days or ranges of days, they're separated by `/`.

My list goes from fine to coarse granularity, so I'd probably reverse that for parsing: start by separating Day+Time groupings, then split to days (or day ranges), then process time range.

One thing conspicuously absent here is multiple discontinuous time ranges on the same day, which is common for restaurants (lunch and dinner hours), but since it's not represented in the examples I suppose I'll exclude the possibility. There's no way to confidently speculate what the syntax would be. But if this were my product I'd have addressed that in design phase 😉

I'll probably also loosen up the casing requirements, even though casing is consistent in examples, cause why not.

### Output format

To start with, any discrete search time will by definition only be on one particular day of the week. If I want to know the restaurant is open on Monday at 11 am, I don't care about its hours on Tuesday. That's a pretty good inherent partitioning tool.

So I can expand `Mon-Sat 11 am - 11 pm` into `Mon 11 am - 11 pm`, `Tue 11 am - 11 pm` ... and so on, bucketing these by day for lookup later. This adds a maximum of N\*7 items to the total search space, but then divides the search time by 7 (since hash lookups are constant time), leading to marginal improvement versus naive scanning.

I suppose I could do a similar thing with the times, but this gets trickier. I could explode every time range into discrete `hh:mm` values for constant time lookup again... but that's a much larger factor (worst case 24\*60=1200 I think?). Then again, each entry is not very large, so memory cost doesn't seem so prohibitive here.

Since input time format is not specified, I have to assume it may include seconds. So I'd need to lookup the top and bottom of the minute to be sure they're both included in the range. O(4), ish (much depends on JS' underlying hash lookup here). Pretty good? Is the memory use worth it? I'll go with 'probably.'

This approach is roughly inspired by spatial hashing from videogames, which I've always liked. Divide and conquer your search space.
