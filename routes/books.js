const express = require('express')
const router = express.Router()
const Book = require('../models/book')
const Author = require('../models/author')
const fs = require('fs')

const path = require('path')
const multer = require('multer')
const uploadPath = path.join('public', Book.coverImageBasePath)
const imageMimeType =['image/jpeg', 'image/png', 'image/gif']
const upload = multer({
    dest: uploadPath,
    fileFilter: (req, file, callback) =>{
        console.log(file)
        callback(null, imageMimeType.includes(file.mimetype))
    }
})



//  All Books route

router.get('/',  async function(req, res){
    let query = Book.find()
    
   
    if (req.query.title != null && req.query.title != ''){
        query = query.regex('title', new RegExp(req.query.title, 'i'))
       
    }
    if (req.query.publishedBefore != null && req.query.publishedBefore != ''){
        query = query.lte('publishedDate', req.query.publishedBefore)
       
    }
    if (req.query.publishedAfter != null && req.query.publishedAfter != ''){
        query = query.gte('publishedDate', req.query.publishedAfter)
       
    }
   try {
        const books = await query.exec()
        res.render('books/index', {books: books, searchOption: req.query})
   } catch {
        res.redirect('/')
   }
   
})

//  new Book route
router.get('/new', async (req, res) => {
    renderNewPage(res, new Book())
   
})


// Create Book Route
router.post('/', upload.single('cover'), async (req, res) => {
    const fileName = req.file != null ? req.file.filename : null

    const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishedDate: new Date(req.body.publishedDate),
    pageCount: req.body.pageCount,
    coverImageName: fileName,
    description: req.body.description
   })
   
   try {
    
    const newBook = await book.save()
    res.redirect('/books')
    
   } catch  {
    if(book.coverImageName != null){
        removeBookCover(book.coverImageName)
    }
    
    renderNewPage(res, book, true)
   }

})


function removeBookCover(fileName){
    fs.unlink(path.join(uploadPath, fileName), err => {
        if(err) console.error(err)
    })
}

async function renderNewPage(res, book, hasError = false){
    try {
        const authors = await Author.find({})
        const params = {
            authors: authors,
            book: book
        }
        if (hasError) params.errorMessage = "error creating a book"
        res.render('books/new', params)
        
    } catch {
        res.redirect('books')
    }
}


module.exports = router