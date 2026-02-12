(function () {
  const PROVINCES = ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'];
  const INDUSTRY_ROLE = {
    funeral_planner: 'funeral-planner',
    estate_lawyer: 'lawyer',
    financial_advisor: 'financial-advisor',
    insurance_broker: 'insurance-broker',
    financial_insurance_agent: 'financial_insurance_agent',
  };

  let draft = { step1: {}, step2: {} };
  let officeLocations = [];

  function formatPhone(value) {
    const digits = (value || '').replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return '(' + digits.slice(0, 3) + ') ' + digits.slice(3);
    return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6);
  }

  function getEl(id) { return document.getElementById(id); }
  function showStep(step) {
    [1, 2, 3].forEach(function (s) {
      var panel = getEl('step' + s);
      var dot = document.querySelector('.progress .step[data-s="' + s + '"]');
      var bar = document.querySelector('.progress .bar[data-b="' + s + '"]');
      if (panel) panel.classList.toggle('active', s === step);
      if (dot) {
        dot.classList.toggle('active', s === step);
        dot.classList.toggle('done', s < step);
      }
      if (bar) bar.classList.toggle('done', s < step);
    });
  }

  function showError(step, msg) {
    var el = getEl('err' + step);
    if (el) {
      el.textContent = msg || '';
      el.style.display = msg ? 'block' : 'none';
    }
  }

  // Step 1
  var phoneEl = getEl('phoneNumber');
  if (phoneEl) {
    phoneEl.addEventListener('input', function () {
      phoneEl.value = formatPhone(phoneEl.value);
    });
  }

  getEl('form1').addEventListener('submit', function (e) {
    e.preventDefault();
    showError(1);
    var pw = getEl('password').value;
    var cp = getEl('confirmPassword').value;
    if (pw !== cp) {
      showError(1, 'Passwords do not match.');
      return;
    }
    draft.step1 = {
      firstName: getEl('firstName').value.trim(),
      lastName: getEl('lastName').value.trim(),
      email: getEl('email').value.trim(),
      phoneNumber: getEl('phoneNumber').value,
      password: pw,
      confirmPassword: cp,
      industry: getEl('industry').value,
      homeAddress: getEl('homeAddress').value.trim(),
      city: getEl('city').value.trim(),
      province: getEl('province').value,
      postalCode: getEl('postalCode').value.trim(),
    };
    renderStep2();
    showStep(2);
  });

  function renderStep2() {
    var industry = (draft.step1.industry || '').trim();
    var role = INDUSTRY_ROLE[industry] || '';
    draft.step2 = draft.step2 || {};
    draft.step2.selectedRole = role;
    draft.step2.step1Industry = industry;
    draft.step2.businessName = getEl('businessName') ? getEl('businessName').value.trim() : (draft.step2.businessName || '');
    draft.step2.professionalTitle = getEl('professionalTitle') ? getEl('professionalTitle').value.trim() : (draft.step2.professionalTitle || '');
    officeLocations = draft.step2.officeLocations || [];

    var container = getEl('step2RoleFields');
    container.innerHTML = '';

    var showFuneral = industry === 'funeral_planner';
    var showLawyer = industry === 'estate_lawyer';
    var showInsurance = industry === 'insurance_broker' || industry === 'financial_insurance_agent';
    var showFinancial = industry === 'financial_advisor' || industry === 'financial_insurance_agent';

    function radio(name, label, options) {
      var html = '<div class="form-group"><label>' + label + ' <span class="req">*</span></label><div class="radio-group">';
      options.forEach(function (v) {
        var id = name + '_' + v;
        var lbl = v === 'non-applicable' ? 'Non Applicable' : v.charAt(0).toUpperCase() + v.slice(1);
        html += '<label><input type="radio" name="' + name + '" value="' + v + '" id="' + id + '"><span>' + lbl + '</span></label>';
      });
      html += '</div></div>';
      return html;
    }

    if (showFuneral) {
      container.innerHTML += radio('hasTruStage', 'Do you have a valid TruStage Life of Canada enrolee number?', ['yes', 'no']);
      container.innerHTML += radio('hasLLQP', 'Do you have a valid LLQP license?', ['yes', 'no']);
      container.innerHTML += radio('llqpQuebec', 'Is your LLQP valid in Quebec?', ['yes', 'no', 'non-applicable']);
    }
    if (showLawyer) {
      container.innerHTML += radio('isLicensed', 'Are you currently licensed and in good standing with your provincial law society?', ['yes', 'no']);
      container.innerHTML += '<div class="form-group"><label>Law society name <span class="req">*</span></label><input type="text" id="lawSocietyName"></div>';
      container.innerHTML += '<div class="form-group"><label>Province(s) you are authorized to practice in <span class="req">*</span></label><input type="text" id="authorizedProvinces"></div>';
    }
    if (showInsurance) {
      container.innerHTML += radio('isLicensedInsurance', 'Are you a licensed life insurance agent in Canada?', ['yes', 'no']);
      container.innerHTML += '<div class="form-group"><label>Licensing province <span class="req">*</span></label><input type="text" id="licensingProvince"></div>';
      container.innerHTML += radio('hasMultipleProvinces', 'Are you licensed in multiple provinces?', ['yes', 'no']);
      container.innerHTML += '<div class="form-group" id="additionalProvincesWrap" style="display:none;"><label>Additional provinces</label><input type="text" id="additionalProvinces"></div>';
    }
    if (showFinancial) {
      container.innerHTML += radio('isRegistered', 'Are you registered with a regulatory organization?', ['yes', 'no']);
      container.innerHTML += '<div class="form-group"><label>Regulatory organization <span class="req">*</span></label><input type="text" id="regulatoryOrganization"></div>';
      container.innerHTML += '<div class="form-group"><label>Province(s) you are registered in <span class="req">*</span></label><input type="text" id="registeredProvinces"></div>';
    }

    if (showFuneral || showLawyer || showInsurance || showFinancial) {
      var locHtml = '<div class="form-group"><label>Office locations <span class="req">*</span></label>';
      officeLocations.forEach(function (loc, i) {
        locHtml += '<div class="loc-item"><span>' + (loc.name || 'Location') + ' – ' + (loc.city || '') + ', ' + (loc.province || '') + '</span><button type="button" class="remove-loc" data-i="' + i + '">Remove</button></div>';
      });
      locHtml += '<div class="add-loc"><input type="text" id="newLocName" placeholder="Office name *"><input type="text" id="newLocStreet" placeholder="Street address" style="margin-top:8px;"><div class="row3" style="margin-top:8px;"><input type="text" id="newLocCity" placeholder="City *"><select id="newLocProvince">' + PROVINCES.map(function (p) { return '<option value="' + p + '">' + p + '</option>'; }).join('') + '</select><input type="text" id="newLocPostal" placeholder="Postal code"></div><button type="button" class="btn btn-secondary" id="addLocBtn" style="margin-top:8px;">Add location</button></div></div>';
      container.innerHTML += locHtml;
    }

    setTimeout(function () {
      if (draft.step2.hasTruStage) document.querySelector('input[name="hasTruStage"][value="' + draft.step2.hasTruStage + '"]') && (document.querySelector('input[name="hasTruStage"][value="' + draft.step2.hasTruStage + '"]').checked = true);
      if (draft.step2.hasLLQP) document.querySelector('input[name="hasLLQP"][value="' + draft.step2.hasLLQP + '"]') && (document.querySelector('input[name="hasLLQP"][value="' + draft.step2.hasLLQP + '"]').checked = true);
      if (draft.step2.llqpQuebec) document.querySelector('input[name="llqpQuebec"][value="' + draft.step2.llqpQuebec + '"]') && (document.querySelector('input[name="llqpQuebec"][value="' + draft.step2.llqpQuebec + '"]').checked = true);
      if (draft.step2.isLicensed) document.querySelector('input[name="isLicensed"][value="' + draft.step2.isLicensed + '"]') && (document.querySelector('input[name="isLicensed"][value="' + draft.step2.isLicensed + '"]').checked = true);
      if (draft.step2.lawSocietyName) (getEl('lawSocietyName') || {}).value = draft.step2.lawSocietyName;
      if (draft.step2.authorizedProvinces) (getEl('authorizedProvinces') || {}).value = draft.step2.authorizedProvinces;
      if (draft.step2.isLicensedInsurance) document.querySelector('input[name="isLicensedInsurance"][value="' + draft.step2.isLicensedInsurance + '"]') && (document.querySelector('input[name="isLicensedInsurance"][value="' + draft.step2.isLicensedInsurance + '"]').checked = true);
      if (draft.step2.licensingProvince) (getEl('licensingProvince') || {}).value = draft.step2.licensingProvince;
      if (draft.step2.hasMultipleProvinces) {
        var r = document.querySelector('input[name="hasMultipleProvinces"][value="' + draft.step2.hasMultipleProvinces + '"]');
        if (r) r.checked = true;
        var wrap = getEl('additionalProvincesWrap');
        if (wrap) wrap.style.display = draft.step2.hasMultipleProvinces === 'yes' ? 'block' : 'none';
      }
      if (draft.step2.additionalProvinces) (getEl('additionalProvinces') || {}).value = draft.step2.additionalProvinces;
      if (draft.step2.isRegistered) document.querySelector('input[name="isRegistered"][value="' + draft.step2.isRegistered + '"]') && (document.querySelector('input[name="isRegistered"][value="' + draft.step2.isRegistered + '"]').checked = true);
      if (draft.step2.regulatoryOrganization) (getEl('regulatoryOrganization') || {}).value = draft.step2.regulatoryOrganization;
      if (draft.step2.registeredProvinces) (getEl('registeredProvinces') || {}).value = draft.step2.registeredProvinces;

      container.querySelectorAll('.remove-loc').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = parseInt(btn.getAttribute('data-i'), 10);
          officeLocations.splice(i, 1);
          draft.step2.officeLocations = officeLocations;
          renderStep2();
        });
      });
      var addBtn = getEl('addLocBtn');
      if (addBtn) {
        addBtn.addEventListener('click', function () {
          var name = (getEl('newLocName') || {}).value.trim();
          var city = (getEl('newLocCity') || {}).value.trim();
          var province = (getEl('newLocProvince') || {}).value;
          if (!name || !city) {
            showError(2, 'Please fill in at least office name and city.');
            return;
          }
          officeLocations.push({
            name: name,
            street_address: (getEl('newLocStreet') || {}).value.trim() || null,
            city: city,
            province: province,
            postal_code: (getEl('newLocPostal') || {}).value.trim() || null,
          });
          draft.step2.officeLocations = officeLocations;
          getEl('newLocName').value = '';
          if (getEl('newLocStreet')) getEl('newLocStreet').value = '';
          getEl('newLocCity').value = '';
          if (getEl('newLocProvince')) getEl('newLocProvince').value = 'BC';
          if (getEl('newLocPostal')) getEl('newLocPostal').value = '';
          renderStep2();
        });
      }
      var multiProv = document.querySelectorAll('input[name="hasMultipleProvinces"]');
      multiProv.forEach(function (r) {
        r.addEventListener('change', function () {
          var w = getEl('additionalProvincesWrap');
          if (w) w.style.display = this.value === 'yes' ? 'block' : 'none';
        });
      });
    }, 0);
  }

  getEl('backToStep1').addEventListener('click', function () {
    draft.step2.businessName = getEl('businessName').value.trim();
    draft.step2.professionalTitle = getEl('professionalTitle').value.trim();
    draft.step2.officeLocations = officeLocations;
    collectStep2IntoDraft();
    showStep(1);
  });

  function collectStep2IntoDraft() {
    draft.step2.businessName = (getEl('businessName') || {}).value.trim();
    draft.step2.professionalTitle = (getEl('professionalTitle') || {}).value.trim();
    var industry = (draft.step1.industry || '').trim();
    var tr = document.querySelector('input[name="hasTruStage"]:checked');
    if (tr) draft.step2.hasTruStage = tr.value;
    var llqp = document.querySelector('input[name="hasLLQP"]:checked');
    if (llqp) draft.step2.hasLLQP = llqp.value;
    var qc = document.querySelector('input[name="llqpQuebec"]:checked');
    if (qc) draft.step2.llqpQuebec = qc.value;
    if (getEl('lawSocietyName')) draft.step2.lawSocietyName = getEl('lawSocietyName').value.trim();
    if (getEl('authorizedProvinces')) draft.step2.authorizedProvinces = getEl('authorizedProvinces').value.trim();
    var ins = document.querySelector('input[name="isLicensedInsurance"]:checked');
    if (ins) draft.step2.isLicensedInsurance = ins.value;
    if (getEl('licensingProvince')) draft.step2.licensingProvince = getEl('licensingProvince').value.trim();
    var multi = document.querySelector('input[name="hasMultipleProvinces"]:checked');
    if (multi) draft.step2.hasMultipleProvinces = multi.value;
    if (getEl('additionalProvinces')) draft.step2.additionalProvinces = getEl('additionalProvinces').value.trim();
    var reg = document.querySelector('input[name="isRegistered"]:checked');
    if (reg) draft.step2.isRegistered = reg.value;
    if (getEl('regulatoryOrganization')) draft.step2.regulatoryOrganization = getEl('regulatoryOrganization').value.trim();
    if (getEl('registeredProvinces')) draft.step2.registeredProvinces = getEl('registeredProvinces').value.trim();
    var lic = document.querySelector('input[name="isLicensed"]:checked');
    if (lic) draft.step2.isLicensed = lic.value;
    draft.step2.officeLocations = officeLocations;
  }

  getEl('form2').addEventListener('submit', function (e) {
    e.preventDefault();
    showError(2);
    collectStep2IntoDraft();
    var industry = (draft.step1.industry || '').trim();
    var showFuneral = industry === 'funeral_planner';
    var showLawyer = industry === 'estate_lawyer';
    var showInsurance = industry === 'insurance_broker' || industry === 'financial_insurance_agent';
    var showFinancial = industry === 'financial_advisor' || industry === 'financial_insurance_agent';
    if ((showFuneral || showLawyer || showInsurance || showFinancial) && officeLocations.length === 0) {
      showError(2, 'Please add at least one office location.');
      return;
    }
    if (showFuneral && (!draft.step2.hasTruStage || !draft.step2.hasLLQP || !draft.step2.llqpQuebec)) {
      showError(2, 'Please answer all questions for your role.');
      return;
    }
    if (showLawyer && (!draft.step2.isLicensed || !(draft.step2.lawSocietyName || '').trim() || !(draft.step2.authorizedProvinces || '').trim())) {
      showError(2, 'Please complete all fields for your role.');
      return;
    }
    if (showInsurance && (!draft.step2.isLicensedInsurance || !(draft.step2.licensingProvince || '').trim())) {
      showError(2, 'Please complete all fields for your role.');
      return;
    }
    if (showFinancial && (!draft.step2.isRegistered || !(draft.step2.regulatoryOrganization || '').trim() || !(draft.step2.registeredProvinces || '').trim())) {
      showError(2, 'Please complete all fields for your role.');
      return;
    }
    showStep(3);
  });

  getEl('backToStep2').addEventListener('click', function () {
    showStep(2);
  });

  getEl('howYouHelp').addEventListener('input', function () {
    var c = getEl('countHelp');
    if (c) c.textContent = this.value.length;
  });
  getEl('whatFamiliesAppreciate').addEventListener('input', function () {
    var c = getEl('countAppreciate');
    if (c) c.textContent = this.value.length;
  });

  getEl('form3').addEventListener('submit', function (e) {
    e.preventDefault();
    showError(3);
    if (!getEl('hasAnsweredAccurately').checked) {
      showError(3, 'Please confirm you have answered all questions accurately.');
      return;
    }

    var step1 = draft.step1;
    var step2 = draft.step2;
    var full_name = [step1.firstName, step1.lastName].filter(Boolean).join(' ').trim();
    var address = {
      street: step1.homeAddress || '',
      city: step1.city || '',
      province: step1.province || '',
      postalCode: step1.postalCode || '',
    };
    var notification_cities = step1.city && step1.province ? [{ city: step1.city, province: step1.province }] : [];

    var specialtyFromRole = {
      'funeral-planner': 'Funeral Planner',
      'lawyer': 'Lawyer',
      'insurance-broker': 'Insurance Broker',
      'financial-advisor': 'Financial Advisor',
      'financial_insurance_agent': 'Financial & Insurance advisor',
    };
    var metadata = {
      agent_role: step2.selectedRole || '',
      specialty: step2.selectedRole ? (specialtyFromRole[step2.selectedRole] || 'Funeral Planner') : '',
      business_name: (step2.businessName || '').trim(),
      bio: {
        years_of_experience: String(getEl('yearsOfExperience').value).trim(),
        practice_philosophy_help: getEl('howYouHelp').value.trim(),
        practice_philosophy_appreciate: getEl('whatFamiliesAppreciate').value.trim(),
      },
    };
    if (step2.selectedRole === 'funeral-planner') {
      metadata.trustage_enroller_number = step2.hasTruStage === 'yes';
      metadata.llqp_license = step2.hasLLQP === 'yes';
      metadata.llqp_quebec = step2.llqpQuebec || '';
    }
    if (step2.selectedRole === 'lawyer') {
      metadata.law_society_name = step2.lawSocietyName || '';
      metadata.authorized_provinces = step2.authorizedProvinces || '';
    }
    if (step2.selectedRole === 'insurance-broker' || step2.selectedRole === 'financial_insurance_agent') {
      metadata.licensing_province = step2.licensingProvince || '';
      metadata.has_multiple_provinces = step2.hasMultipleProvinces === 'yes';
      metadata.additional_provinces = step2.additionalProvinces || '';
    }
    if (step2.selectedRole === 'financial-advisor' || step2.selectedRole === 'financial_insurance_agent') {
      metadata.regulatory_organization = step2.regulatoryOrganization || '';
      metadata.registered_provinces = step2.registeredProvinces || '';
    }

    var office_locations = (step2.officeLocations || []).map(function (loc) {
      return {
        name: loc.name || '',
        street_address: loc.street_address || null,
        city: loc.city || '',
        province: loc.province || '',
        postal_code: loc.postal_code || null,
      };
    }).filter(function (loc) { return loc.name && loc.city; });

    var signupData = {
      email: (step1.email || '').trim(),
      password: step1.password || '',
      full_name: full_name,
      first_name: (step1.firstName || '').trim() || null,
      last_name: (step1.lastName || '').trim() || null,
      phone: (step1.phoneNumber || '').replace(/\D/g, '').slice(0, 10) || step1.phoneNumber,
      address: address,
      notification_cities: notification_cities,
      job_title: (step2.professionalTitle || '').trim(),
      metadata: metadata,
      office_locations: office_locations,
    };

    var btn = getEl('submitBtn');
    if (btn) btn.disabled = true;

    if (!window.electronAPI || !window.electronAPI.createAccountSignup) {
      showError(3, 'This page must be opened in the Soradin app.');
      if (btn) btn.disabled = false;
      return;
    }

    window.electronAPI.createAccountSignup(signupData).then(function (result) {
      if (result.ok) {
        document.querySelector('.wrap').style.display = 'none';
        getEl('successPanel').style.display = 'block';
      } else {
        showError(3, result.error || 'Signup failed. Please try again.');
      }
      if (btn) btn.disabled = false;
    }).catch(function (err) {
      showError(3, err.message || 'Something went wrong. Please try again.');
      if (btn) btn.disabled = false;
    });
  });

  getEl('businessName').value = draft.step2.businessName || '';
  getEl('professionalTitle').value = draft.step2.professionalTitle || '';
})();
