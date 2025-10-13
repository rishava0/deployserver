const Item = require('../model/todoModel');

exports.getSuggestions = async (query) => {
  const items = await Item.find(
    { FittedSN: { $regex: query, $options: "i" } },
    "FittedSN"
  ).limit(10);
  return items.map((i) => i.FittedSN);
};

