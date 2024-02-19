class Contact {
  constructor(fName, lName, email, notes) {
    this.id = generateUniqueId();
    this.fName = fName;
    this.lName = lName;
    this.email = email || '';
    this.notes = notes || '';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

function generateUniqueId() {
  return 'id#' + Date.now();
}

module.exports = Contact;