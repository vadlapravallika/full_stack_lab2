var express = require('express');
var router = express.Router();
const contactsJSON = require('../crud.js');
const Contact = require('../models/contacts');
const sanitizeHtml = require('sanitize-html');


function validateContactData(data) {
  const { fName, lName, email } = data;

  // Check for non-empty, non-numeric first name and last name
  const isNonEmptyString = value => typeof value === 'string' && value.trim() !== '';
  const containsOnlyLetters = value => /^[A-Za-z ]+$/.test(value);

  const isNonNumericFirstName = isNonEmptyString(fName) && containsOnlyLetters(fName);
  const isNonNumericLastName = isNonEmptyString(lName) && containsOnlyLetters(lName);

  // Check for valid email address using a simple regex pattern
  const isInvalidEmail = email && !/^\S+@\S+\.\S+$/.test(email);

  // Return true if all validations pass
  return isNonNumericFirstName && isNonNumericLastName && !isInvalidEmail;
}

// Sanitize user input
function sanitizeContactData(data) {
  return {
    fName: sanitizeHtml(data.fName.trim(), { allowedTags: [], allowedAttributes: {} }),
    lName: sanitizeHtml(data.lName.trim(), { allowedTags: [], allowedAttributes: {} }),
    email: sanitizeHtml(data.email.trim(), { allowedTags: [], allowedAttributes: {} }),
    notes: sanitizeHtml(data.notes.trim(), { allowedTags: ['b', 'i', 'em', 'strong', 'a'], allowedAttributes: { 'a': ['href'] } }),
  };
}

router.get('/list', (req, res) => {
  try {
    const contacts = contactsJSON.getAllContacts();
    res.render('contacts/list', { contacts, layout: 'layout' });
  } catch (error) {
    console.error('Error retrieving contacts:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/add', (req, res) => {
  res.render('contacts/add');
});
router.get('/edit', (req, res) => {
  const contact = {}
  res.render('contacts/add', { contact, layout: 'add' });
});
router.get('/view', (req, res) => {
  res.render('contacts/view');
});

router.get('/:id/edit', (req, res) => {
  try {
    const { id } = req.params;
    const contact = contactsJSON.getContactById(id);

    if (!contact) {
      // Handle the case where the contact is not found
      res.status(404).send('Contact not found');
      return;
    }

    res.render('contacts/edit', { contact, layout: 'edit' });
  } catch (error) {
    console.error('Error retrieving contact for editing:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to handle creating a new contact
router.post('/', (req, res) => {
  try {
    // const { fName, lName, email, notes } = req.body;
    // Validate the form data
    if (!validateContactData(req.body)) {
      // Display error message and render the form again
      // console.log(lName, 'im in')
      const contacts = contactsJSON.getAllContacts();
      return res.render('contacts/add', { errorMessage: 'Please fill in all required fields.', contacts, layout: 'layout' });
    }

    // Sanitize user input
    const sanitizedData = sanitizeContactData(req.body);

    const newContact = new Contact(sanitizedData.fName, sanitizedData.lName, sanitizedData.email, sanitizedData.notes);

    // Attempt to create the contact
    const createdContact = contactsJSON.createContact(newContact);
    console.log(createdContact)
    if (!createdContact) {
      // Handle the case where the contact creation fails
      return res.status(500).send('Failed to create contact');
    }
    res.redirect('/contacts/list');
  } catch (error) {
    // Handle unexpected errors
    console.error('Error creating contact:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const contact = contactsJSON.getContactById(id);
    if (!contact) {
      // Handle the case where the contact is not found
      res.status(404).send('Contact not found');
      return;
    }
    // Format createdAt and updatedAt dates for better readability
    const formattedContact = {
      ...contact,
      createdAt: new Date(contact.createdAt).toLocaleString(),
      updatedAt: new Date(contact.updatedAt).toLocaleString(),
    };
    console.log(formattedContact)
    res.render('contacts/view', { contact: formattedContact, layout: 'layout' });
    } catch (error) {
      console.error('Error retrieving contact:', error);
      res.status(500).send('Internal Server Error');
    }
});

// Route to handle deleting a contact
router.post('/:id/delete', (req, res) => {
  try {
    const { id } = req.params;

    // Attempt to delete the contact
    const success = contactsJSON.deleteContact(id);

    if (!success) {
      console.log('Im in')
      // Handle the case where the contact deletion fails
      res.status(500).send('Failed to delete contact');
      return;
    }
    res.redirect('/contacts/list');
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to handle viewing a dynamically generated contact
router.get('/generated/:id', (req, res) => {
  try {
    // Get the dynamically generated ID from the URL
    const dynamicId = req.params.id;

    // Logic to fetch the dynamically generated contact
    const generatedContact = contactsJSON.getContactById(dynamicId);

    if (!generatedContact) {
      // Handle the case where the contact is not found
      res.status(404).send('Generated Contact not found');
      return;
    }

    res.render('contacts/show', { contact: generatedContact, layout: 'layout' });
  } catch (error) {
    console.error('Error retrieving generated contact:', error);
    res.status(500).send('Internal Server Error');
  }
});

// updating an existing contact
router.post('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, emailAddress, notes } = req.body;
    // Validation
    if (!validateContactData(req.body)) {
      console.log(req.body, 'jj')
      const contact = contactsJSON.getContactById(id);
      return res.render(`contacts/edit`, { errorMessage: 'Please fill in all required fields.', contact, layout: 'layout' });
    }
    const sanitizedData = sanitizeContactData(req.body);
    
    const existingContact = contactsJSON.getContactById(id);
    
    if (!existingContact) {
      // Handle the case where the contact is not found
      res.status(404).send('Contact not found');
      return;
    }
    
    // Update the existing contact
    existingContact.fName = sanitizedData.fName;
    existingContact.lName = sanitizedData.lName;
    existingContact.email = sanitizedData.email;
    existingContact.notes = sanitizedData.notes;
    
    // Attempt to update the contact
    const success = contactsJSON.updateContact(existingContact);
    
    if (!success) {
      // Handle the case where the contact update fails
      return res.status(500).send('Failed to update contact');
    }

    res.redirect(`/contacts/list`);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).send('Internal Server Error');
  }
});
module.exports = router;