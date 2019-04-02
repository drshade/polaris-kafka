package test.sessions.producers

val adjectives = listOf(
    "ablest", "absurd", "actual", "allied", "artful", "atomic", "august",
    "bamboo", "benign", "blonde", "blurry", "bolder", "breezy", "bubbly",
    "candid", "casual", "cheery", "classy", "clever", "convex", "cubist",
    "dainty", "dapper", "decent", "deluxe", "docile", "dogged", "drafty",
    "earthy", "easier", "edible", "elfish", "excess", "exotic", "expert",
    "fabled", "famous", "feline", "finest", "flaxen", "folksy", "frozen",
    "gaslit", "gentle", "gifted", "ginger", "global", "golden", "grassy",
    "hearty", "hidden", "hipper", "honest", "humble", "hungry", "hushed",
    "iambic", "iconic", "indoor", "inward", "ironic", "island", "italic",
    "jagged", "jangly", "jaunty", "jiggly", "jovial", "joyful", "junior",
    "kabuki", "karmic", "keener", "kindly", "kingly", "klutzy", "knotty",
    "lambda", "leader", "linear", "lively", "lonely", "loving", "luxury",
    "madras", "marble", "mellow", "metric", "modest", "molten", "mystic",
    "native", "nearby", "nested", "newish", "nickel", "nimbus", "nonfat",
    "oblong", "offset", "oldest", "onside", "orange", "outlaw", "owlish",
    "padded", "peachy", "pepper", "player", "preset", "proper", "pulsar",
    "quacky", "quaint", "quartz", "queens", "quinoa", "quirky",
    "racing", "rental", "rising", "rococo", "rubber", "rugged", "rustic",
    "sanest", "scenic", "shadow", "skiing", "stable", "steely", "syrupy",
    "taller", "tender", "timely", "trendy", "triple", "truthy", "twenty",
    "ultima", "unbent", "unisex", "united", "upbeat", "uphill", "usable",
    "valued", "vanity", "velcro", "velvet", "verbal", "violet", "vulcan",
    "webbed", "wicker", "wiggly", "wilder", "wonder", "wooden", "woodsy",
    "yearly", "yeasty", "yeoman", "yogurt", "yonder", "youthy", "yuppie",
    "zaftig", "zanier", "zephyr", "zeroed", "zigzag", "zipped", "zircon"
)

val nouns = listOf(
    "anaconda", "airfield", "aqualung", "armchair", "asteroid", "autoharp",
    "babushka", "bagpiper", "barbecue", "bookworm", "bullfrog", "buttress",
    "caffeine", "chinbone", "countess", "crawfish", "cucumber", "cutpurse",
    "daffodil", "darkroom", "doghouse", "dragster", "drumroll", "duckling",
    "earthman", "eggplant", "electron", "elephant", "espresso", "eyetooth",
    "falconer", "farmland", "ferryman", "fireball", "footwear", "frosting",
    "gadabout", "gasworks", "gatepost", "gemstone", "goldfish", "greenery",
    "handbill", "hardtack", "hawthorn", "headwind", "henhouse", "huntress",
    "icehouse", "idealist", "inchworm", "inventor", "insignia", "ironwood",
    "jailbird", "jamboree", "jerrycan", "jetliner", "jokester", "joyrider",
    "kangaroo", "kerchief", "keypunch", "kingfish", "knapsack", "knothole",
    "ladybird", "lakeside", "lambskin", "larkspur", "lollipop", "lungfish",
    "macaroni", "mackinaw", "magician", "mainsail", "mongoose", "moonrise",
    "nailhead", "nautilus", "neckwear", "newsreel", "novelist", "nuthatch",
    "occupant", "offering", "offshoot", "original", "organism", "overalls",
    "painting", "pamphlet", "paneling", "pendulum", "playroom", "ponytail",
    "quacking", "quadrant", "queendom", "question", "quilting", "quotient",
    "rabbitry", "radiator", "renegade", "ricochet", "riverbed", "rucksack",
    "sailfish", "sandwich", "sculptor", "seashore", "seedcake", "stickpin",
    "tabletop", "tailbone", "teamwork", "teaspoon", "traverse", "turbojet",
    "umbrella", "underdog", "undertow", "unicycle", "universe", "uptowner",
    "vacation", "vagabond", "valkyrie", "variable", "villager", "vineyard",
    "waggoner", "waxworks", "waterbed", "wayfarer", "whitecap", "woodshed",
    "yachting", "yardbird", "yearbook", "yearling", "yeomanry", "yodeling",
    "zaniness", "zeppelin", "ziggurat", "zirconia", "zoologer", "zucchini"
)

fun randomAdjective() : String {
    return adjectives.shuffled()[0]
}

fun randomName() : String {
    val first = adjectives.shuffled()[0]
    val last = nouns.shuffled()[0]
    return "$first-$last"
}