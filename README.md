# liine-takehome

For takehomes I like to sketch out my thoughts and take notes in the README as I go, so here's that.

## Initial problem impressions

This seems like a pretty simple assignment, with two main challenges: parsing the hours string resiliently, and deciding how to index restaurants to be looked up with some arbitrary time later.

I'm assuming other considerations, like scaling to large numbers of restaurants, updating the list, etc are out of scope.

Functionally I need: an HTTP server, loading a CSV from file, appropriate datastructure(s) to store the restaurants in memory for retrieval... I think that's about it. Validation for API inputs, too.

Since I'm by far the most comfortable with Typescript, I'm opting to implement with it. I think I could probably take a swing at this with Python, but I'd spend a lot more time looking up stlib and tooling I've forgotten than writing code, probably.

I'm planning on using my favorite HTTP setup, Hono + Zod, which covers request handling and validation and has excellent type support.

For the two core problems I identified, I'll probably do some TDD to make sure I get the details right. Particular for parsing problems I find it's easier to just start with tests.

After setting up some basic scaffolding I'll dig into the hard problems.
