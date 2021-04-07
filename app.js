//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const _ = require('lodash')
const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://admin-santosh:test123@test-cluster.ekkrn.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  }
);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);
const item1 = new Item({
  name: "HELLO",
});

const item2 = new Item({
  name: "World",
});

const item3 = new Item({
  name: "Day1",
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName); ;
  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //Create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect('/' + customListName)
      } else {
        // Show existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  });
  
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, (err, foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect('/'+ listName)
    })
  }
  
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName =req.body.listName;
  if(listName==="Today"){
    Item.findByIdAndRemove(checkedItemId, (err) => {
    if (!err) {
      console.log("Item has been removed");
      res.redirect("/");
    } 
  })
}else{
  List.findOneAndUpdate({name: listName},{$pull:{items:{_id: checkedItemId}}},(err, foundList)=>{
    if(!err){
      res.redirect('/'+ listName)
    }
  })
}
  
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started successfully");
});
