const mongoose = require('mongoose')

const TypeSchema = new mongoose.Schema({
    title:{
        type: String,
         require: true,
    },
    contentType: {
        type:String,
    },
    image:{
        type: Buffer,
        require: true
    }
}) 
const TypeModel = mongoose.model("types", TypeSchema)
module.exports = TypeModel