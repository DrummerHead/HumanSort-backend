# HumanSort-backend

HumanSort is a single page web application that helps sorting an array of pictures according to human preference.


## Background

With algorithms such as [MergeSort](https://en.wikipedia.org/wiki/Merge_sort) and [QuickSort](https://en.wikipedia.org/wiki/Quicksort) the entities being sorted have an inherent nature that facilitates their sorting. If you are sorting an array of numbers, strings or dates, each entity can be compared with each other and a predicate of "is A bigger than B" can easily be answered.

The use case for HumanSort is entities for which there is no inherent nature that facilitates their sorting, and thus the answer for "is A bigger than B" has to be handled by an external judge, in this case human preference.


## Algorithm

To minimize amount of comparisons needed to obtain a sorted array, a strategy of binary insertion is used (similar to [binary search](https://en.wikipedia.org/wiki/Binary_search_algorithm)). We keep an always sorted list of items, and since it is always sorted if an unranked item is said to be better than an item in position 5 it can also be said that it is better than all ranked items lower than 5. With a binary strategy we're able to reduce the amount of comparisons needed to get a sorted array.

Consider two groups, an "Unranked" array of entities whose sort order is irrelevant and a "Ranked" array of entities sorted from best to worst; that is, an item of index 0 is the best item, an item of index 1 is second best, an item of index 2 is third best, and so forth.

```JavaScript
// First state, no ranking yet

const unranked = ['🍇', '🍋', '🍌', '🍍', '🍑', '🍒', '🍓'];
const ranked = [];
```

We select two entities at random and we present them to the human to be compared, obtaining our first comparison.

```JavaScript
// In the frontend: Which one do you like more, 🍍 or 🍓 ?
// Human selects 🍓

// New state:
const unranked = ['🍇', '🍋', '🍌', '🍑', '🍒'];
const ranked = ['🍓', '🍍'];
```

After we have a list of ranked items, we iteratively:

1. Select a random item from unranked list to be compared
2. Find the pivot point of the ranked list, the pivot point being the element in the middle defined by `<T>(array: T[]): number => Math.ceil(array.length / 2) - 1`
3. Compare random unranked with pivot point, it will either be better or worse and based on this answer a new subgroup from ranked is selected
4. A pivot point for this new subgroup is selected and a comparison is performed again, process repeated until the list is of only one item, in which case the new random item from unranked can be inserted in the ranked list since its position can be determined.
5. Newly ranked item no longer belongs to unranked list.

And we keep doing these steps for the remainder of unranked entities until they are all ranked.

```JavaScript
const unranked = ['🍇', '🍋', '🍌', '🍑', '🍒'];
const ranked = ['🍓', '🍍'];

// New random item from unranked is selected: '🍒'
// Pivot of ranked is '🍓'

// In the frontend: Which one do you like more, '🍒' or '🍓'?
// Human selects '🍒'
// There is no ranked subgroup, so we can insert '🍒'

// New state:
const unranked = ['🍇', '🍋', '🍌', '🍑'];
const ranked = ['🍒', '🍓', '🍍'];

// New random item from unranked is selected: '🍋',
// Pivot of ranked is '🍓'

// In the frontend: Which one do you like more, '🍋' or '🍓'?
// Human selects '🍓'
// New subgroup from ranked to compare is ['🍍']
// In the frontend: Which one do you like more, '🍋' or '🍍'?
// Human selects '🍍'
// There is no ranked subgroup, so we can insert '🍋'

// New state:
const unranked = ['🍇', '🍌', '🍑'];
const ranked = ['🍒', '🍓', '🍍', '🍋'];

// New random item from unranked is selected: '🍇',
// Pivot of ranked is '🍓'
// In the frontend: Which one do you like more, '🍇' or '🍓'?
// Human selects '🍓'
// New subgroup from ranked to compare is ['🍍', '🍋']
// Pivot of subgroup is '🍍'
// In the frontend: Which one do you like more, '🍇' or '🍍'?
// Human selects '🍇'
// There is no ranked subgroup, so we can insert '🍇'

// New state:
const unranked = ['🍌', '🍑'];
const ranked = ['🍒', '🍓', '🍇', '🍍', '🍋'];

// New random item from unranked is selected: '🍑',
// Pivot of ranked is '🍇'
// In the frontend: Which one do you like more, '🍑' or '🍇'?
// Human selects '🍇'
// New subgroup from ranked to compare is ['🍍', '🍋']
// Pivot of subgroup is '🍍'
// In the frontend: Which one do you like more, '🍑' or '🍍'?
// Human selects '🍑'
// There is no ranked subgroup, so we can insert '🍑'

// New state:
const unranked = ['🍌'];
const ranked = ['🍒', '🍓', '🍇', '🍑', '🍍', '🍋'];

// New random item from unranked is selected: '🍌',
// Pivot of ranked is '🍇'
// In the frontend: Which one do you like more, '🍌' or '🍇'?
// Human selects '🍌'
// New subgroup from ranked to compare is ['🍒', '🍓']
// Pivot of subgroup is '🍒'
// In the frontend: Which one do you like more, '🍌' or '🍒'?
// Human selects '🍒'
// New subgroup from ranked to compare is ['🍓']
// In the frontend: Which one do you like more, '🍌' or '🍓'?
// Human selects '🍌'
// There is no ranked subgroup, so we can insert '🍌'

// New state:
const unranked = [];
const ranked = ['🍒', '🍌', '🍓', '🍇', '🍑', '🍍', '🍋'];

// No unranked left, ranking finished!
```

## Technology

The backend consists of:

* [SQLite](https://www.sqlite.org/) database
* [node-sqlite3](https://github.com/TryGhost/node-sqlite3) SQLite driver
* [Express](https://github.com/expressjs/express) backend serving API

You can see the database schema and API endpoints documentation at the [shared folder](/src/shared) in [types.ts](/src/shared/types.ts).

## Installing

For now, this application is intended to be used locally on your machine, to sort already existing images you have in your harddrive. You should put these images inside of the `/pics/` folder.

It is assumed you have [node and npm installed](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

This repo comes with some sample images we can use and a script to populate the database. Run this at project root:

```
npm install
cp -r pics-sample pics
cd db/
node pollinate.js
cd ..
```

And to run it:

```
npm run start
```

Which should run the server at [http://localhost:7777/](http://localhost:7777/)

If you already have your own images to sort, then put them in the `/pics/` folder and run:

```
cd db/
node backup.js
rm comparo.db
node pollinate.js
cd ..
```

And same steps as above to run it.


## Companion repository

This repository contains only the backend, for the full experience follow the README instructions at [HumanSort-frontend](https://github.com/DrummerHead/HumanSort-frontend)
