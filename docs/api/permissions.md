# Permission Matrix

<style>
.perm-table td.yes { background-color: #5be682ff; text-align: center; color: #000000ff}
.perm-table td.no { background-color: #f38888ff; text-align: center; color: #000000ff}
</style>

<table class="perm-table">
<thead>
<tr><th>Action</th><th>Staff</th><th>Registrar</th><th>Admin</th></tr>
</thead>
<tbody>
<tr><td colspan="4"><strong>Users</strong></td></tr>
<tr><td>View own profile</td><td class="yes">+</td><td class="yes">+</td><td class="yes">+</td></tr>
<tr><td>View all users</td><td class="no">-</td><td class="yes">+</td><td class="yes">+</td></tr>
<tr><td>Create Staff users</td><td class="no">-</td><td class="yes">+</td><td class="yes">+</td></tr>
<tr><td>Edit Staff users (excluding role)</td><td class="no">-</td><td class="yes">+</td><td class="yes">+</td></tr>
<tr><td>Delete Staff users</td><td class="no">-</td><td class="yes">+</td><td class="yes">+</td></tr>
<tr><td>Create Registrar/Admin users</td><td class="no">-</td><td class="no">-</td><td class="yes">+</td></tr>
<tr><td>Edit Registrar/Admin users</td><td class="no">-</td><td class="no">-</td><td class="yes">+</td></tr>
<tr><td>Edit user roles</td><td class="no">-</td><td class="no">-</td><td class="yes">+</td></tr>
<tr><td>Delete Registrar/Admin users</td><td class="no">-</td><td class="no">-</td><td class="yes">+</td></tr>

<tr><td colspan="4"><strong>Bookings</strong></td></tr>
<tr><td>Own bookings CRUD</td><td class="yes">+</td><td class="yes">+</td><td class="yes">+</td></tr>
<tr><td>View room booking schedule</td><td class="yes">+</td><td class="yes">+</td><td class="yes">+</td></tr>
<tr><td>View all bookings table</td><td class="no">-</td><td class="yes">+</td><td class="yes">+</td></tr>
<tr><td>Manage any booking</td><td class="no">-</td><td class="yes">+</td><td class="yes">+</td></tr>

<tr><td colspan="4"><strong>Rooms & System</strong></td></tr>
<tr><td>View/search rooms</td><td class="yes">+</td><td class="yes">+</td><td class="yes">+</td></tr>
<tr><td>Manage rooms/buildings</td><td class="no">-</td><td class="no">-</td><td class="yes">+</td></tr>
<tr><td>Manage equipment</td><td class="no">-</td><td class="no">-</td><td class="yes">+</td></tr>
<tr><td>View audit logs</td><td class="no">-</td><td class="no">-</td><td class="yes">+</td></tr>
</tbody>
</table>
