import { TeWrapper } from "../../lib/wrapper";


export const removeLicenseButtons = (wrapper: TeWrapper, html: string) =>
{
    if (wrapper.licenseManager.isLicensed())
    {
        html = removeButton("enterLicense", html);
        html = removeButton("getLicense", html);
    }
    else {
        html = removeButton("view.licensePage.show", html);
        html = removeButton("view.taskMonitor.show", html);
    }
    return html;
};


export const removeViewLicenseButton = (html: string) =>
{
    return removeButton("view.licensePage.show", html);
};


export const removeButton = (command: string, html: string) =>
{
    const idx1 = html.indexOf(`<button data-action="command:taskexplorer.${command}"`),
          idx2 = html.lastIndexOf("<div class=\"te-button-container", idx1),
          idx3 = html.indexOf("</div>", idx2);
    html = html.replace(html.slice(idx2, idx3), "");
    return html;
};
