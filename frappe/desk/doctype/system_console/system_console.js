// Copyright (c) 2020, Frappe Technologies and contributors
// For license information, please see license.txt

frappe.ui.form.on('System Console', {
	onload: function(frm) {
		frappe.ui.keys.add_shortcut({
			shortcut: 'shift+enter',
			action: () => frm.page.btn_primary.trigger('click'),
			page: frm.page,
			description: __('Execute Console script'),
			ignore_inputs: true,
		});
		frm.set_value("type", "Python");
	},

	refresh: function(frm) {
		frm.disable_save();
		frm.page.set_primary_action(__("Execute"), $btn => {
			$btn.text(__("Executing..."));
			return frm
				.execute_action("Execute")
				.then(() => frm.trigger("render_sql_output"))
				.finally(() => $btn.text(__("Execute")));
		});
	},

	type: function(frm) {
		if (frm.doc.type == "Python") {
			frm.set_value("output", "");
			if (frm.sql_output) {
				frm.sql_output.destroy();
				frm.get_field("sql_output").html("");
			}
		}
	},

	render_sql_output: function(frm) {
		if (frm.doc.type !== "SQL") return;
		if (frm.sql_output) {
			frm.sql_output.destroy();
			frm.get_field("sql_output").html("");
		}

		if (frm.doc.output.startsWith("Traceback")) {
			return;
		}

		let result = JSON.parse(frm.doc.output);
		frm.set_value("output", `${result.length} ${result.length == 1 ? 'row' : 'rows'}`);

		if (result.length) {
			let columns = Object.keys(result[0]);
			frm.sql_output = new DataTable(
				frm.get_field("sql_output").$wrapper.get(0),
				{
					columns,
					data: result
				}
			);
		}
	},

	show_processlist: function(frm) {
		if (frm.doc.show_processlist) {
			// keep refreshing every 5 seconds
			frm.events.refresh_processlist(frm);
			frm.processlist_interval = setInterval(() => frm.events.refresh_processlist(frm), 5000);
		} else {
			if (frm.processlist_interval) {

				// end it
				clearInterval(frm.processlist_interval);
				frm.get_field("processlist").html('');
			}
		}
	},

	refresh_processlist: function(frm) {
		let timestamp = new Date();
		frappe.call('frappe.desk.doctype.system_console.system_console.show_processlist').then(r => {
			let rows = '';
			console.log(r.message)
			if(r.message['db_type'] == 'postgres'){
				for (let row of r.message['data']) {
					rows += `<tr>
						<td>${row.pid}</td>
						<td>${row.query_start}</td>
						<td>${row.state}</td>
						<td>${row.query}</td>
						<td>${row.wait_event}</td>
					</tr>`

				}
			}
			else{
				for (let row of r.message) {
					rows += `<tr>
						<td>${row.Id}</td>
						<td>${row.Time}</td>
						<td>${row.State}</td>
						<td>${row.Info}</td>
						<td>${row.Progress}</td>
					</tr>`
				}
			}
			frm.get_field('processlist').html(`
				<p class='text-muted'>Requested on: ${timestamp}</p>
				<table class='table-bordered' style='width: 100%'>
				<thead><tr>
					<th width='10%'>Id</ht>
					<th width='10%'>Time</ht>
					<th width='10%'>State</ht>
					<th width='60%'>Info</ht>
					<th width='10%'>Progress</ht>
				</tr></thead>
				<tbody>${rows}</thead>`);
		});
	},
});
