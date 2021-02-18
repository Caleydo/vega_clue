/**
 * Created by Holger Stitz on 18.08.2016.
 */
import { Dialog } from 'phovea_ui';
/**
 * utility dialog when a session was not found
 * @param {CLUEGraphManager} manager
 * @param {string} id session id
 */
export function showProveanceGraphNotFoundDialog(manager, id) {
    const dialog = Dialog.generateDialog('Session Not Found!', 'Create New Temporary Session');
    // append bg-danger to the dialog parent element
    dialog.body.parentElement.parentElement.parentElement.classList.add('bg-danger');
    dialog.body.innerHTML = `
      <p>
          The requested session <strong>"${id}"</strong> was not found or is not accessible.
      </p>
      <p>
          Possible reasons are that you
          <ul>
              <li>requested a <i>temporary session</i> that is already expired</li>
              <li>tried to access a <i>temporary session</i> of another user</li>
              <li>tried to access a <i>private persistent session</i> of another user</li>
          </ul>
      </p>
      <p>
          In the latter two cases, please contact the original owner of the session to create a public persistent session.
      </p>`;
    dialog.onSubmit(() => {
        dialog.hide();
        return false;
    });
    dialog.onHide(() => {
        dialog.destroy();
        manager.newGraph();
    });
    dialog.show();
}
export function showLoadErrorDialog() {
    const dialog = Dialog.generateDialog('Error loading Vega JSON Specification!', 'Close');
    dialog.body.innerHTML = `
      <p>
          We could not find a valid Vega JSON Specification for the given URL.
      </p>
      <p>
          Please check the URL or try a different one.
      </p>`;
    dialog.onSubmit(() => {
        dialog.hide();
        return false;
    });
    dialog.onHide(() => {
        dialog.destroy();
    });
    dialog.show();
}
//# sourceMappingURL=dialogs.js.map