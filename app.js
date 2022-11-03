const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const _ = require("lodash");

const sampleJSONObject = {
  format: "CHIP-0007",
  name: "Pikachu",
  description: "Electric-type Pokémon with stretchy cheeks",
  minting_tool: "SuperMinter/2.5.2",
  sensitive_content: false,
  series_number: 22,
  series_total: 1000,
  attributes: [
    {
      trait_type: "Species",
      value: "Mouse",
    },
    {
      trait_type: "Color",
      value: "Yellow",
    },
    {
      trait_type: "Friendship",
      value: 50,
      min_value: 0,
      max_value: 255,
    },
  ],
  collection: {
    name: "Example Pokémon Collection",
    id: "e43fcfe6-1d5c-4d6e-82da-5de3aa8b3b57",
    attributes: [
      {
        type: "description",
        value:
          "Example Pokémon Collection is the best Pokémon collection. Get yours today!",
      },
      {
        type: "icon",
        value: "https://examplepokemoncollection.com/image/icon.png",
      },
      {
        type: "banner",
        value: "https://examplepokemoncollection.com/image/banner.png",
      },
      {
        type: "twitter",
        value: "ExamplePokemonCollection",
      },
      {
        type: "website",
        value: "https://examplepokemoncollection.com/",
      },
    ],
  },
  data: {
    example_data:
      "VGhpcyBpcyBhbiBleGFtcGxlIG9mIGRhdGEgdGhhdCB5b3UgbWlnaHQgd2FudCB0byBzdG9yZSBpbiB0aGUgZGF0YSBvYmplY3QuIE5GVCBhdHRyaWJ1dGVzIHdoaWNoIGFyZSBub3QgaHVtYW4gcmVhZGFibGUgc2hvdWxkIGJlIHBsYWNlZCB3aXRoaW4gdGhpcyBvYmplY3QsIGFuZCB0aGUgYXR0cmlidXRlcyBhcnJheSB1c2VkIG9ubHkgZm9yIGluZm9ybWF0aW9uIHdoaWNoIGlzIGludGVuZGVkIHRvIGJlIHJlYWQgYnkgdGhlIHVzZXIu",
  },
};

const newCSVArray = [];

// 0. Delete any csv file in the newlyCretedCSVFile folder

const directory = "newlyCreatedCSVFile";

fs.readdirSync(directory).forEach((dir) => {
  fs.unlinkSync(path.join(directory, dir));
  console.log(`${dir} deleted successfully`);
});

// 1. Read the csv file

const fileReaderArray = fs
  .readdirSync(path.join(__dirname))
  .filter((el) => el.endsWith(".csv"));

if (fileReaderArray.length !== 1)
  throw new Error(
    "Error!!!🎆🎆🎆 Please check the root folder and make sure it contains only one CSV file"
  );

const csvFileContents = fs.readFileSync(`${fileReaderArray[0]}`, {
  encoding: "utf8",
});

// 2. loop through the csv file, read each line and save the object in an array
const csvFileArray = csvFileContents
  .replaceAll(/\r/g, "")
  .split("\n")
  .map((el) => el.split(","));
// console.log(csvFileArray[0]);
const seriesNumberIndex = csvFileArray[0].findIndex(
  (el) => el?.toLowerCase().trim() === "series number"
);
const currentNameIndex = csvFileArray[0].findIndex(
  (el) => el?.toLowerCase().trim() === "current name"
);
const nameIndex = csvFileArray[0].findIndex(
  (el) => el?.toLowerCase().trim() === "name"
);
const descriptorIndex = csvFileArray[0].findIndex(
  (el) => el?.toLowerCase().trim() === "descriptor"
);
const newNameIndex = csvFileArray[0].findIndex(
  (el) => el?.toLowerCase().trim() === "new name"
);
const descriptionIndex = csvFileArray[0].findIndex(
  (el) => el?.toLowerCase().trim() === "description"
);
const uuidIndex = csvFileArray[0].findIndex(
  (el) => el?.toLowerCase().trim() === "uuid"
);

for (let i = 1; i < csvFileArray.length; i++) {
  const newSampleJSONObject = _.cloneDeep(sampleJSONObject);
  //   const newSampleJSONObject = sampleJSONObject;
  newSampleJSONObject.name = csvFileArray[i][nameIndex];
  newSampleJSONObject.description = csvFileArray[i][descriptionIndex];
  newSampleJSONObject.series_number = +csvFileArray[i][seriesNumberIndex];
  newSampleJSONObject.collection.name = csvFileArray[i][currentNameIndex];
  newSampleJSONObject.collection.id = csvFileArray[i][uuidIndex];

  newCSVArray.push(newSampleJSONObject);
}

// 3. create the hash for the JSON values using 'sha-256' algorithm
// console.log(newCSVArray);

async function createHash(object) {
  const { name } = object;
  const hash = await new Promise((resolve) =>
    setTimeout(() => {
      resolve(
        crypto.createHash("sha256").update(JSON.stringify(object)).digest("hex")
      );
    }, 0)
  );
  return { hash, name };
}

async function consumePromise() {
  let hashedValuesArray = (
    await Promise.allSettled(newCSVArray.map((el) => createHash(el)))
  )
    .filter((el) => el.status === "fulfilled")
    .map((el) => {
      const { hash, name } = el.value;
      return { hash, name };
    });

  const resultArray = csvFileArray.map((arr, i) => {
    if (i === 0) return [...arr, "HASH"].join(",");
    if (i !== 0) {
      const { name, hash } = hashedValuesArray[i - 1];
      if (name) {
        return [...arr, hash].join(",");
      } else return [...arr, ""].join(",");
    }
  });

  //   console.log(csvFileArray);
  fs.writeFileSync(
    `newlyCreatedCSVFile/${fileReaderArray[0].slice(
      0,
      fileReaderArray[0].length - 4
    )}.output.csv`,
    resultArray.join("\n")
  );
}

consumePromise();
